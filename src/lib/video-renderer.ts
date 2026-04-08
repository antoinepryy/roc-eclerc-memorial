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
  preview?: boolean;
};

export async function renderVideoHommage(options: RenderOptions): Promise<void> {
  const { photoLocalPaths, templateId, musicLocalPath, texteOverlay, outputPath, defuntNom, defuntDates, preview } = options;
  const tpl = getTemplate(templateId);

  // Preview: résolution réduite, timing raccourci, max 3 photos
  const w = preview ? 640 : 1280;
  const h = preview ? 360 : 720;
  const res = `${w}:${h}`;       // for scale filter
  const resX = `${w}x${h}`;      // for lavfi color/zoompan
  const fps = preview ? 15 : 25;
  const photoDur = preview ? 2.5 : tpl.photoDuration;
  const crossDur = preview ? 0.8 : tpl.crossfadeDuration;
  const introDur = preview ? 2 : tpl.introDuration;
  const outroDur = preview ? 2 : tpl.outroDuration;
  const photos = preview ? photoLocalPaths.slice(0, 3) : photoLocalPaths;

  const tempDir = path.join(path.dirname(outputPath), `work-${Date.now()}`);
  await mkdir(tempDir, { recursive: true });

  try {
    // Écran titre
    const titlePath = path.join(tempDir, "title.png");
    await createTitleImage(titlePath, defuntNom, defuntDates, tpl, resX);

    // Écran outro
    const outroPath = path.join(tempDir, "outro.png");
    await createOutroImage(outroPath, tpl, resX);

    // Construire les inputs FFmpeg
    const inputs: string[] = [];
    inputs.push(`-loop 1 -t ${introDur} -i "${titlePath}"`);
    for (const p of photos) {
      inputs.push(`-loop 1 -t ${photoDur} -i "${p}"`);
    }
    inputs.push(`-loop 1 -t ${outroDur} -i "${outroPath}"`);

    const hasAudio = musicLocalPath !== null;
    if (hasAudio) {
      inputs.push(`-stream_loop -1 -i "${musicLocalPath}"`);
    }

    const totalInputs = 2 + photos.length;
    const totalPhotoDuration = photos.length * photoDur - (photos.length - 1) * crossDur;
    const totalDuration = introDur + totalPhotoDuration + outroDur;

    // Filter graph
    const filterParts: string[] = [];

    for (let i = 0; i < totalInputs; i++) {
      let vf = `[${i}:v]scale=${res}:force_original_aspect_ratio=decrease,`
        + `pad=${res}:(ow-iw)/2:(oh-ih)/2:color=0x${tpl.bgColor},setsar=1`;

      const isPhoto = i > 0 && i < totalInputs - 1;

      if (tpl.kenBurns && isPhoto && !preview) {
        vf += `,zoompan=z='min(zoom+0.0008\\,1.15)':d=${photoDur * fps}:s=${resX}:fps=${fps}`;
      }
      if (tpl.id === "cinematique" && isPhoto) {
        const barH = preview ? 30 : 60;
        vf += `,drawbox=x=0:y=0:w=iw:h=${barH}:color=black:t=fill`
          + `,drawbox=x=0:y=ih-${barH}:w=iw:h=${barH}:color=black:t=fill`;
      }
      if (tpl.vignette && isPhoto) {
        vf += `,vignette=PI/4`;
      }
      if (tpl.borderStyle === "thin" && isPhoto) {
        const pad = preview ? 10 : 20;
        vf += `,drawbox=x=${pad}:y=${pad}:w=iw-${pad * 2}:h=ih-${pad * 2}:color=0xF8A809:t=2`;
      }
      if (tpl.overlayGradient && isPhoto) {
        const gradH = preview ? 60 : 120;
        vf += `,drawbox=x=0:y=ih-${gradH}:w=iw:h=${gradH}:color=black@0.4:t=fill`;
      }

      vf += `,fps=${fps},format=yuv420p[v${i}]`;
      filterParts.push(vf);
    }

    // Crossfade transitions
    let lastOutput = "v0";
    let offset = introDur - crossDur;

    for (let i = 1; i < totalInputs; i++) {
      const nextOutput = i === totalInputs - 1 ? "video_raw" : `cf${i}`;
      filterParts.push(
        `[${lastOutput}][v${i}]xfade=transition=${tpl.transition}:duration=${crossDur}:offset=${offset.toFixed(2)}[${nextOutput}]`
      );
      lastOutput = nextOutput;
      offset += photoDur - crossDur;
    }

    // Text overlay
    if (texteOverlay) {
      const escaped = texteOverlay
        .replace(/\\/g, "\\\\\\\\")
        .replace(/'/g, "\u2019")
        .replace(/:/g, "\\:")
        .replace(/%/g, "%%")
        .replace(/\n/g, " ");

      const textSize = preview ? Math.round(tpl.textSize * 0.5) : tpl.textSize;
      const yPos = tpl.textPosition === "top" ? "40"
        : tpl.textPosition === "center" ? "(h-text_h)/2"
        : "h-50";

      filterParts.push(
        `[video_raw]drawtext=${fontOpt()}text='${escaped}':`
        + `fontsize=${textSize}:fontcolor=white:`
        + `x=(w-text_w)/2:y=${yPos}:`
        + `enable='between(t,${introDur},${introDur + totalPhotoDuration})':`
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
        `-af "afade=t=in:d=1,afade=t=out:st=${Math.max(0, totalDuration - 2).toFixed(2)}:d=2"`,
        `-c:a aac -b:a ${preview ? "64k" : "128k"}`,
      );
    }

    parts.push(
      `-c:v libx264 -preset ${preview ? "ultrafast" : "fast"} -crf ${preview ? 35 : 25}`,
      `-movflags +faststart`,
      `-y "${outputPath}"`,
    );

    const cmd = parts.join(" ");
    const mode = preview ? "preview" : "final";
    console.log(`[video-renderer] Starting ${mode} render...`);

    await execAsync(cmd, { timeout: preview ? 60000 : 300000, maxBuffer: 10 * 1024 * 1024 });

    console.log(`[video-renderer] ${mode} render complete:`, outputPath);
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function createTitleImage(outputPath: string, nom: string, dates: string, tpl: VideoTemplate, resX = "1280x720"): Promise<void> {
  const esc = (s: string) => s.replace(/'/g, "\u2019").replace(/:/g, "\\:");
  const bg = `0x${tpl.bgColor}`;
  const f = fontOpt();
  const scale = resX === "640x360" ? 0.5 : 1;

  const titleSize = Math.round((tpl.id === "cinematique" ? 48 : 52) * scale);
  const dateSize = Math.round(24 * scale);
  const subSize = Math.round(18 * scale);

  const filters = [
    `drawtext=${f}text='${esc(nom)}':fontsize=${titleSize}:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-${Math.round(30 * scale)}:shadowcolor=black:shadowx=2:shadowy=2`,
    `drawtext=${f}text='${esc(dates)}':fontsize=${dateSize}:fontcolor=0xF8A809:x=(w-text_w)/2:y=(h-text_h)/2+${Math.round(40 * scale)}`,
    `drawtext=${f}text='En souvenir':fontsize=${subSize}:fontcolor=0xF8A809:x=(w-text_w)/2:y=h-${Math.round(60 * scale)}`,
  ];

  if (tpl.borderStyle === "thin") {
    const p = Math.round(30 * scale);
    filters.push(`drawbox=x=${p}:y=${p}:w=iw-${p * 2}:h=ih-${p * 2}:color=0xF8A809:t=1`);
  }

  const cmd = `ffmpeg -f lavfi -i "color=c=${bg}:s=${resX}:d=1" -vf "${filters.join(",")}" -frames:v 1 -y "${outputPath}"`;
  await execAsync(cmd, { timeout: 15000 });
}

async function createOutroImage(outputPath: string, tpl: VideoTemplate, resX = "1280x720"): Promise<void> {
  const bg = `0x${tpl.bgColor}`;
  const f = fontOpt();
  const scale = resX === "640x360" ? 0.5 : 1;

  const filters = [
    `drawtext=${f}text='Roc Eclerc Nancy':fontsize=${Math.round(36 * scale)}:fontcolor=0xF8A809:x=(w-text_w)/2:y=(h-text_h)/2-${Math.round(20 * scale)}:shadowcolor=black:shadowx=1:shadowy=1`,
    `drawtext=${f}text='Avec vous\\, dans ces moments':fontsize=${Math.round(20 * scale)}:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2+${Math.round(30 * scale)}`,
  ];

  if (tpl.borderStyle === "thin") {
    const p = Math.round(30 * scale);
    filters.push(`drawbox=x=${p}:y=${p}:w=iw-${p * 2}:h=ih-${p * 2}:color=0xF8A809:t=1`);
  }

  const cmd = `ffmpeg -f lavfi -i "color=c=${bg}:s=${resX}:d=1" -vf "${filters.join(",")}" -frames:v 1 -y "${outputPath}"`;
  await execAsync(cmd, { timeout: 15000 });
}

/** Rewrite a public S3 URL to internal if S3_INTERNAL_ENDPOINT is set */
function toInternalUrl(url: string): string {
  const internal = process.env.S3_INTERNAL_ENDPOINT;
  const publicUrl = process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT || "";
  if (internal && publicUrl && url.startsWith(publicUrl)) {
    return url.replace(publicUrl, internal);
  }
  return url;
}

/** Download file from URL to local path (uses internal URL if available) */
export async function downloadToFile(url: string, localPath: string): Promise<void> {
  const fetchUrl = toInternalUrl(url);
  const res = await fetch(fetchUrl);
  if (!res.ok) throw new Error(`Failed to download ${fetchUrl}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(localPath, buf);
}

/** Get S3 URL for a music track */
export function getMusicS3Url(musiqueId: string): string {
  const s3Base = process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT || "";
  const bucket = process.env.S3_BUCKET || "roc-eclerc-memorial";
  return `${s3Base}/${bucket}/audio/${musiqueId}.mp3`;
}
