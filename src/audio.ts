import {
  AudioPlayer,
  AudioPlayerStatus,
  createAudioResource,
  AudioResource,
  CreateAudioPlayerOptions,
} from "@discordjs/voice";
import { Logger } from "./logger";
import { readdir, stat } from "fs/promises";

class SoundPlayer extends AudioPlayer {
  #availableSounds: Promise<Set<string>>;

  constructor(options?: CreateAudioPlayerOptions) {
    super(options);
    this.#availableSounds = this.#readAvailableSounds();
  }

  async #readAvailableSounds() {
    const dir = await readdir("sounds/", { withFileTypes: true });

    const files = dir.flatMap((e) => (e.isFile() ? e.name : []));

    return new Set(files);
  }

  async available() {
    const all = await this.#availableSounds;

    return [...all.values()].join(",");
  }

  async playSound(name: string): Promise<boolean> {
    const canPlay = await this.canPlaySound(name);
    if (!canPlay) return false;

    const resource = createAudio(name);

    try {
      super.play(resource);
      return true;
    } catch (error) {
      Logger.error(error);
      return false;
    }
  }

  async canPlaySound(name: string) {
    try {
      const stats = await stat(`sounds/${name}.mp3`);
      return stats.isFile();
    } catch (_) {
      return false;
    }
  }
}

function setupPlayer(): SoundPlayer {
  const player = new SoundPlayer();

  player.on(AudioPlayerStatus.Playing, () => {
    Logger.info("Playing audio...");
  });

  player.on(AudioPlayerStatus.Idle, () => {
    Logger.info("Idle...");
  });

  player.on("error", (error) => {
    Logger.error(
      `Error: ${error.message} with resource ${JSON.stringify(
        error.resource.metadata
      )}`
    );
  });

  return player;
}

interface SoundMeta {
  readonly title: string;
}

function createAudio(name: string): AudioResource<SoundMeta> {
  return createAudioResource(`sounds/${name}.mp3`, {
    metadata: { title: name },
  });
}

export const player = setupPlayer();
