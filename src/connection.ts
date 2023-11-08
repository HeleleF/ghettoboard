import {
  PlayerSubscription,
  VoiceConnectionStatus,
  joinVoiceChannel,
} from "@discordjs/voice";
import { VoiceBasedChannel } from "discord.js";
import { player } from "./audio";
import { Logger } from "./logger";

class SubscriptionManager {
  #subscription: PlayerSubscription | undefined;

  subscribed() {
    return this.#subscription !== undefined;
  }

  ensureSubscribed(channel: VoiceBasedChannel): void {
    const { id, guild, name } = channel;
    if (this.#subscription) {
      Logger.info(`Already subscribed!`);
      return;
    }

    Logger.info(`Connecting to channel ${name}...`);

    const connection = joinVoiceChannel({
      channelId: id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
    });

    connection.on(VoiceConnectionStatus.Disconnected, () => {
      Logger.info("Voice connection disconnected!");
    });

    this.#subscription = connection.subscribe(player);
  }

  destroy() {
    this.#subscription?.unsubscribe();
    this.#subscription?.connection.destroy();
    this.#subscription = undefined;

    Logger.info(`Connection destroyed`);
  }
}

export const subscriptionManager = new SubscriptionManager();
