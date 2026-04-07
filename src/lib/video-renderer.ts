import { execFile } from "child_process";
import { writeFile, mkdir, readFile, unlink } from "fs/promises";
import path from "path";
import { promisify } from "util";
import { getTemplate, type VideoTemplate } from "./video-templates";

const execFileAsync = promisify(execFile);

type RenderOptions = {
  photoUrls: string[];
  templateId: string;
  musique: string;
  texteOverlay: string | null;
  outputPath: string;
  defuntNom: string;
  defuntDates: string;
};

export async function renderVideoHommage(options: RenderOptions): Promise<void> {
  const { photoUrls, templateId, musique, texteOverlay, outputPath, defuntNom, defuntDates } = options;
  const tpl = getTemplate(templateId);

  const outputDir = path.dirname(outputPath);
  await mkdir(outputDir, { recursive: true });

  const tempDir = path.join(outputDir, `temp-${Date.now()}`);
  await mkdir(tempDir, { recursive: true });

  try {
    const totalPhotoDuration = photoUrls.length * tpl.photoDuration - (photoUrls.length - 1) * tpl.crossfadeDuration;
    const totalDuration = tpl.introDuration + totalPhotoDuration + tpl.outroDuration;

    // Écran titre
    const titlePath = path.join(tempDir, "title.png");
    await createTitleImage(titlePath, defuntNom, defuntDates, tpl);

    // Écran outro
    const outroPath = path.join(tempDir, "outro.png");
    await createOutroImage(outroPath, tpl);

    // Construire les inputs
    const inputs: string[] = [];
    inputs.push("-loop", "1", "-t", String(tpl.introDuration), "-i", titlePath);
    for (const p of photoUrls) {
      inputs.push("-loop", "1", "-t", String(tpl.photoDuration), "-i", p);
    }
    inputs.push("-loop", "1", "-t", String(tpl.outroDuration), "-i", outroPath);

    // Musique en boucle
    let hasAudio = false;
    try {
      await readFile(musique);
      inputs.push("-stream_loop", "-1", "-i", musique);
      hasAudio = true;
    } catch {
      // pas de musique
    }

    const totalInputs = 2 + photoUrls.length;
    const audioInputIndex = totalInputs;
    const filterParts: string[] = [];

    // Scale + effets par template
    for (let i = 0; i < totalInputs; i++) {
      let videoFilter = `[${i}:v]scale=1280:720:force_original_aspect_ratio=decrease,` +
        `pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0x${tpl.bgColor},setsar=1`;

      // Ken Burns sur les photos (pas titre/outro)
      if (tpl.kenBurns && i > 0 && i < totalInputs - 1) {
        videoFilter += `,zoompan=z='min(zoom+0.0008,1.15)':d=${tpl.photoDuration * 25}:s=1280x720:fps=25`;
      }

      // Barres cinéma (letterbox)
      if (tpl.id === "cinematique" && i > 0 && i < totalInputs - 1) {
        videoFilter += `,drawbox=x=0:y=0:w=iw:h=60:color=black:t=fill` +
          `,drawbox=x=0:y=ih-60:w=iw:h=60:color=black:t=fill`;
      }

      // Vignette
      if (tpl.vignette && i > 0 && i < totalInputs - 1) {
        videoFilter += `,vignette=PI/4`;
      }

      // Bordure fine
      if (tpl.borderStyle === "thin" && i > 0 && i < totalInputs - 1) {
        videoFilter += `,drawbox=x=20:y=20:w=iw-40:h=ih-40:color=0xF8A809:t=2`;
      }

      // Gradient overlay pour lisibilité du texte
      if (tpl.overlayGradient && i > 0 && i < totalInputs - 1) {
        videoFilter += `,drawbox=x=0:y=ih-120:w=iw:h=120:color=black@0.4:t=fill`;
      }

      videoFilter += `,fps=25,format=yuv420p[v${i}]`;
      filterParts.push(videoFilter);
    }

    // Transitions entre segments
    let lastOutput = "v0";
    let offset = tpl.introDuration - tpl.crossfadeDuration;

    for (let i = 1; i < totalInputs; i++) {
      const nextOutput = i === totalInputs - 1 ? "video_raw" : `cf${i}`;
      filterParts.push(
        `[${lastOutput}][v${i}]xfade=transition=${tpl.transition}:duration=${tpl.crossfadeDuration}:offset=${offset}[${nextOutput}]`
      );
      lastOutput = nextOutput;
      offset += tpl.photoDuration - tpl.crossfadeDuration;
    }

    // Overlay texte
    if (texteOverlay) {
      const escaped = texteOverlay
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "'\\''")
        .replace(/:/g, "\\:")
        .replace(/%/g, "%%");

      const yPos = tpl.textPosition === "top" ? "40"
        : tpl.textPosition === "center" ? "(h-text_h)/2"
        : "h-50";

      filterParts.push(
        `[video_raw]drawtext=fontfile=/usr/share/fonts/noto/NotoSans-Regular.ttf:text='${escaped}':` +
        `fontsize=${tpl.textSize}:fontcolor=white:` +
        `x=(w-text_w)/2:y=${yPos}:` +
        `enable='between(t,${tpl.introDuration},${tpl.introDuration + totalPhotoDuration})':` +
        `shadowcolor=black:shadowx=2:shadowy=2[video_final]`
      );
    } else {
      filterParts.push("[video_raw]null[video_final]");
    }

    // Commande FFmpeg
    const ffmpegArgs = [
      ...inputs,
      "-filter_complex", filterParts.join(";"),
      "-map", "[video_final]",
    ];

    if (hasAudio) {
      ffmpegArgs.push(
        "-map", `${audioInputIndex}:a`,
        "-t", String(totalDuration),
        "-af", `afade=t=in:d=2,afade=t=out:st=${totalDuration - 3}:d=3`,
        "-c:a", "aac", "-b:a", "128k",
      );
    }

    ffmpegArgs.push(
      "-c:v", "libx264",
      "-preset", "medium",
      "-crf", "23",
      "-movflags", "+faststart",
      "-y",
      outputPath,
    );

    await execFileAsync("ffmpeg", ffmpegArgs, { timeout: 180000 });

  } finally {
    for (const f of ["title.png", "outro.png"]) {
      try { await unlink(path.join(tempDir, f)); } catch { /* */ }
    }
    try { const { rmdir } = await import("fs/promises"); await rmdir(tempDir); } catch { /* */ }
  }
}

async function createTitleImage(outputPath: string, nom: string, dates: string, tpl: VideoTemplate): Promise<void> {
  const escaped = (s: string) => s.replace(/'/g, "'\\''").replace(/:/g, "\\:");
  const bg = `0x${tpl.bgColor}`;

  // Style titre selon template
  const titleSize = tpl.id === "cinematique" ? 48 : tpl.id === "serenite" ? 56 : 52;
  const dateColor = tpl.id === "lumiere" ? "0xF8A809" : "0xF8A809";
  const subtitleText = tpl.id === "cinematique" ? "In Memoriam" : "Hommage";

  const filters = [
    `drawtext=fontfile=/usr/share/fonts/noto/NotoSans-Regular.ttf:text='${escaped(nom)}':fontsize=${titleSize}:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-30:shadowcolor=black:shadowx=2:shadowy=2`,
    `drawtext=fontfile=/usr/share/fonts/noto/NotoSans-Regular.ttf:text='${escaped(dates)}':fontsize=24:fontcolor=${dateColor}:x=(w-text_w)/2:y=(h-text_h)/2+40`,
    `drawtext=fontfile=/usr/share/fonts/noto/NotoSans-Regular.ttf:text='${subtitleText}':fontsize=18:fontcolor=0xF8A809:x=(w-text_w)/2:y=h-60`,
  ];

  if (tpl.borderStyle === "thin") {
    filters.push(`drawbox=x=30:y=30:w=iw-60:h=ih-60:color=0xF8A809:t=1`);
  }

  await execFileAsync("ffmpeg", [
    "-f", "lavfi", "-i", `color=c=${bg}:s=1280x720:d=1`,
    "-vf", filters.join(","),
    "-frames:v", "1", "-y", outputPath,
  ], { timeout: 15000 });
}

async function createOutroImage(outputPath: string, tpl: VideoTemplate): Promise<void> {
  const bg = `0x${tpl.bgColor}`;

  const filters = [
    `drawtext=fontfile=/usr/share/fonts/noto/NotoSans-Regular.ttf:text='Roc Eclerc Nancy':fontsize=36:fontcolor=0xF8A809:x=(w-text_w)/2:y=(h-text_h)/2-20:shadowcolor=black:shadowx=1:shadowy=1`,
    `drawtext=fontfile=/usr/share/fonts/noto/NotoSans-Regular.ttf:text='La\\, pour vous':fontsize=20:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2+30`,
  ];

  if (tpl.borderStyle === "thin") {
    filters.push(`drawbox=x=30:y=30:w=iw-60:h=ih-60:color=0xF8A809:t=1`);
  }

  await execFileAsync("ffmpeg", [
    "-f", "lavfi", "-i", `color=c=${bg}:s=1280x720:d=1`,
    "-vf", filters.join(","),
    "-frames:v", "1", "-y", outputPath,
  ], { timeout: 15000 });
}

export function getMusicPath(musiqueId: string): string {
  return path.join(process.cwd(), "public", "audio", `${musiqueId}.mp3`);
}
