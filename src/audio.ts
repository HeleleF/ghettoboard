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
  #resourceQueue: AudioResource<SoundMeta>[];
  #playing: boolean;

  constructor(options?: CreateAudioPlayerOptions) {
    super(options);
    this.#playing = false;
    this.#resourceQueue = [];

    super.on(AudioPlayerStatus.Playing, (_, state) => {
      this.#playing = true;
      const current = this.#resourceQueue.shift();

      Logger.info(
        `Playing ${
          current?.metadata.title ??
          (state.resource.metadata as SoundMeta).title
        }`
      );
    });

    super.on(AudioPlayerStatus.Idle, () => {
      this.#playing = false;
      if (this.#resourceQueue.length > 0) {
        Logger.info(`Consuming queue, ${this.#resourceQueue.length} remaining`);
        super.play(this.#resourceQueue[0]);
      }
    });

    super.on("error", (error) => {
      this.#playing = false;
      this.#resourceQueue = [];
      Logger.error(
        `Error: ${error.message} with resource ${JSON.stringify(
          error.resource.metadata
        )}`
      );
    });
  }

  async available() {
    const dir = await readdir("sounds/", { withFileTypes: true });

    return dir.flatMap((e) => (e.isFile() ? e.name.slice(0, -4) : [])).sort();
  }

  async canPlaySound(name: string) {
    try {
      const stats = await stat(`sounds/${name}.mp3`);
      return stats.isFile();
    } catch (_) {
      return false;
    }
  }

  async playSound(name: string, force = false): Promise<boolean> {
    const canPlay = await this.canPlaySound(name);
    if (!canPlay) return false;

    const resource = createAudio(name);

    return force ? this.#immediately(resource) : this.#queue(resource);
  }

  #immediately(resource: AudioResource): boolean {
    this.#resourceQueue = [];
    try {
      super.play(resource);
      return true;
    } catch (error) {
      Logger.error(error);
      return false;
    }
  }

  #queue(resource: AudioResource<SoundMeta>): boolean {
    this.#resourceQueue.push(resource);

    if (!this.#playing) {
      super.play(this.#resourceQueue[0]);
    }

    return true;
  }
}

interface SoundMeta {
  readonly title: string;
}

function createAudio(name: string): AudioResource<SoundMeta> {
  return createAudioResource(`sounds/${name}.mp3`, {
    metadata: { title: name },
  });
}

export const player = new SoundPlayer();
