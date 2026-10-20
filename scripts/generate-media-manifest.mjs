import { readdir, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, extname, join } from 'node:path';

const projectDirectory = dirname(dirname(fileURLToPath(import.meta.url)));
const mediaDirectory = join(projectDirectory, 'media');
const manifestPath = join(mediaDirectory, 'videos.json');
const musicDirectory = join(projectDirectory, 'music');
const musicManifestPath = join(musicDirectory, 'tracks.json');
const videoExtensions = new Set(['.mp4', '.m4v', '.webm', '.ogv', '.ogg', '.mov']);
const audioExtensions = new Set(['.mp3', '.m4a', '.wav', '.ogg', '.opus', '.aac', '.flac']);

const entries = await readdir(mediaDirectory, { withFileTypes: true });
const videos = entries
    .filter(entry => entry.isFile() && videoExtensions.has(extname(entry.name).toLowerCase()))
    .map(entry => `/media/${encodeURIComponent(entry.name)}`)
    .sort((a, b) => a.localeCompare(b));

await writeFile(manifestPath, `${JSON.stringify(videos, null, 2)}\n`, 'utf8');
process.stdout.write(`Generated media/videos.json with ${videos.length} video(s).\n`);

const musicEntries = await readdir(musicDirectory, { withFileTypes: true });
const tracks = await Promise.all(musicEntries
    .filter(entry => entry.isFile() && audioExtensions.has(extname(entry.name).toLowerCase()))
    .map(async entry => {
        const filePath = join(musicDirectory, entry.name);
        const { size } = await stat(filePath);
        if (size < 128) return null;
        return {
            src: `/music/${encodeURIComponent(entry.name)}`,
            title: entry.name.slice(0, -extname(entry.name).length)
        };
    }));
const sortedTracks = tracks
    .filter(Boolean)
    .sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' }));

await writeFile(musicManifestPath, `${JSON.stringify(sortedTracks, null, 2)}\n`, 'utf8');
process.stdout.write(`Generated music/tracks.json with ${sortedTracks.length} track(s).\n`);
