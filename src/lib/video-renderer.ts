import { exec } from "child_process";
import { writeFile, mkdir, rm } from "fs/promises";
import path from "path";
import { promisify } from "util";
import { getTemplate, type VideoTemplate } from "./video-templates";

const execAsync = promisify(exec);

const FONT_PATH = process.env.NODE_ENV === "production"
  ? "/usr/share/fonts/noto/NotoSans-Regular.ttf"
  : "";

function fontOpt(): string {
  return FONT_PATH ? `fontfile=${FONT_PATH}:` : "";
}

type RenderOptions = {
  photoLocalPaths: string[];
  templateId: string;
  musicLocalPath: string | null;
  texteOverlay: string | null;
  outputPath: string;
  defuntNom: string;
  defuntDates: string;
};

export async function renderVideoHommage(options: RenderOptions): Promise<void> {
  const { photoLocalPaths, templateId, musicLocalPath, texteOverlay, outputPath, defuntNom, defuntDates } = options;
  const tpl = getTemplate(templateId);

  const tempDir = path.join(path.dirname(outputPath), `work-${Date.now()}`);
  await mkdir(tempDir, { recursive: true });

  try {
    // Écran titre
    const titlePath = path.join(tempDir, "title.png");
    await createTitleImage(titlePath, defuntNom, defuntDates, tpl);

    // Écran outro
    const outroPath = path.join(tempDir, "outro.png");
    await createOutroImage(outroPath, tpl);

    // Construire les inputs FFmpeg
    const inputs: string[] = [];
    inputs.push(`-loop 1 -t ${tpl.introDuration} -i "${titlePath}"`);
    for (const p of photoLocalPaths) {
      inputs.push(`-loop 1 -t ${tpl.photoDuration} -i "${p}"`);
    }
    inputs.push(`-loop 1 -t ${tpl.outroDuration} -i "${outroPath}"`);

    const hasAudio = musicLocalPath !== null;
    if (hasAudio) {
      inputs.push(`-stream_loop -1 -i "${musicLocalPath}"`);
    }

    const totalInputs = 2 + photoLocalPaths.length; // title + photos + outro
    const totalPhotoDuration = photoLocalPaths.length * tpl.photoDuration
      - (photoLocalPaths.length - 1) * tpl.crossfadeDuration;
    const totalDuration = tpl.introDuration + totalPhotoDuration + tpl.outroDuration;

    // Filter graph
    const filterParts: string[] = [];

    // Scale + effects per input
    for (let i = 0; i < totalInputs; i++) {
      let vf = `[${i}:v]scale=1280:720:force_original_aspect_ratio=decrease,`
        + `pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0x${tpl.bgColor},setsar=1`;

      const isPhoto = i > 0 && i < totalInputs - 1;

      if (tpl.kenBurns && isPhoto) {
        vf += `,zoompan=z='min(zoom+0.0008\\,1.15)':d=${tpl.photoDuration * 25}:s=1280x720:fps=25`;
      }
      if (tpl.id === "cinematique" && isPhoto) {
        vf += `,drawbox=x=0:y=0:w=iw:h=60:color=black:t=fill`
          + `,drawbox=x=0:y=ih-60:w=iw:h=60:color=black:t=fill`;
      }
      if (tpl.vignette && isPhoto) {
        vf += `,vignette=PI/4`;
      }
      if (tpl.borderStyle === "thin" && isPhoto) {
        vf += `,drawbox=x=20:y=20:w=iw-40:h=ih-40:color=0xF8A809:t=2`;
      }
      if (tpl.overlayGradient && isPhoto) {
        vf += `,drawbox=x=0:y=ih-120:w=iw:h=120:color=black@0.4:t=fill`;
      }

      vf += `,fps=25,format=yuv420p[v${i}]`;
      filterParts.push(vf);
    }

    // Crossfade transitions
    let lastOutput = "v0";
    let offset = tpl.introDuration - tpl.crossfadeDuration;

    for (let i = 1; i < totalInputs; i++) {
      const nextOutput = i === totalInputs - 1 ? "video_raw" : `cf${i}`;
      filterParts.push(
        `[${lastOutput}][v${i}]xfade=transition=${tpl.transition}:duration=${tpl.crossfadeDuration}:offset=${offset.toFixed(2)}[${nextOutput}]`
      );
      lastOutput = nextOutput;
      offset += tpl.photoDuration - tpl.crossfadeDuration;
    }

    // Text overlay
    if (texteOverlay) {
      const escaped = texteOverlay
        .replace(/\\/g, "\\\\\\\\")
        .replace(/'/g, "\u2019")
        .replace(/:/g, "\\:")
        .replace(/%/g, "%%")
        .replace(/\n/g, " ");

      const yPos = tpl.textPosition === "top" ? "40"
        : tpl.textPosition === "center" ? "(h-text_h)/2"
        : "h-50";

      filterParts.push(
        `[video_raw]drawtext=${fontOpt()}text='${escaped}':`
        + `fontsize=${tpl.textSize}:fontcolor=white:`
        + `x=(w-text_w)/2:y=${yPos}:`
        + `enable='between(t,${tpl.introDuration},${tpl.introDuration + totalPhotoDuration})':`
        + `shadowcolor=black:shadowx=2:shadowy=2[video_final]`
      );
    } else {
      filterParts.push("[video_raw]null[video_final]");
    }

    // Build command
    const parts = [
      "ffmpeg",
      ...inputs,
      `-filter_complex "${filterParts.join(";")}"`,
      `-map "[video_final]"`,
    ];

    if (hasAudio) {
      const audioIdx = totalInputs;
      parts.push(
        `-map ${audioIdx}:a`,
        `-t ${totalDuration.toFixed(2)}`,
        `-af "afade=t=in:d=2,afade=t=out:st=${(totalDuration - 3).toFixed(2)}:d=3"`,
        `-c:a aac -b:a 128k`,
      );
    }

    parts.push(
      `-c:v libx264 -preset fast -crf 25`,
      `-movflags +faststart`,
      `-y "${outputPath}"`,
    );

    const cmd = parts.join(" ");
    console.log("[video-renderer] Starting FFmpeg render...");

    await execAsync(cmd, { timeout: 300000, maxBuffer: 10 * 1024 * 1024 });

    console.log("[video-renderer] Render complete:", outputPath);
  } finally {
    // Cleanup temp work dir
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function createTitleImage(outputPath: string, nom: string, dates: string, tpl: VideoTemplate): Promise<void> {
  const esc = (s: string) => s.replace(/'/g, "\u2019").replace(/:/g, "\\:");
  const bg = `0x${tpl.bgColor}`;
  const f = fontOpt();

  const titleSize = tpl.id === "cinematique" ? 48 : 52;
  const subtitle = "En souvenir";

  const filters = [
    `drawtext=${f}text='${esc(nom)}':fontsize=${titleSize}:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-30:shadowcolor=black:shadowx=2:shadowy=2`,
    `drawtext=${f}text='${esc(dates)}':fontsize=24:fontcolor=0xF8A809:x=(w-text_w)/2:y=(h-text_h)/2+40`,
    `drawtext=${f}text='${subtitle}':fontsize=18:fontcolor=0xF8A809:x=(w-text_w)/2:y=h-60`,
  ];

  if (tpl.borderStyle === "thin") {
    filters.push(`drawbox=x=30:y=30:w=iw-60:h=ih-60:color=0xF8A809:t=1`);
  }

  const cmd = `ffmpeg -f lavfi -i "color=c=${bg}:s=1280x720:d=1" -vf "${filters.join(",")}" -frames:v 1 -y "${outputPath}"`;
  await execAsync(cmd, { timeout: 15000 });
}

async function createOutroImage(outputPath: string, tpl: VideoTemplate): Promise<void> {
  const bg = `0x${tpl.bgColor}`;
  const f = fontOpt();

  const filters = [
    `drawtext=${f}text='Roc Eclerc Nancy':fontsize=36:fontcolor=0xF8A809:x=(w-text_w)/2:y=(h-text_h)/2-20:shadowcolor=black:shadowx=1:shadowy=1`,
    `drawtext=${f}text='Avec vous\\, dans ces moments':fontsize=20:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2+30`,
  ];

  if (tpl.borderStyle === "thin") {
    filters.push(`drawbox=x=30:y=30:w=iw-60:h=ih-60:color=0xF8A809:t=1`);
  }

  const cmd = `ffmpeg -f lavfi -i "color=c=${bg}:s=1280x720:d=1" -vf "${filters.join(",")}" -frames:v 1 -y "${outputPath}"`;
  await execAsync(cmd, { timeout: 15000 });
}

/** Download file from URL to local path */
export async function downloadToFile(url: string, localPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(localPath, buf);
}

/** Get S3 URL for a music track */
export function getMusicS3Url(musiqueId: string): string {
  const s3Base = process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT || "";
  const bucket = process.env.S3_BUCKET || "roc-eclerc-memorial";
  return `${s3Base}/${bucket}/audio/${musiqueId}.mp3`;
}
