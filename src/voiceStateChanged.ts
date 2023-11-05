import { VoiceBasedChannel, VoiceState } from "discord.js";

import { subscriptionManager } from "./connection";
import { VoiceStateChangedEvent, asEvent } from "./voiceStateEvent";
import { Logger } from "./logger";
import { bold } from "chalk";
import { player } from "./audio";
import { delay } from "./utils";

export function onVoiceStateUpdate(prev: VoiceState, next: VoiceState): void {
  onVoiceStateEvent(asEvent(prev, next));
}

async function onVoiceStateEvent(event: VoiceStateChangedEvent): Promise<void> {
  switch (event.status) {
    case "USER_JOINED": {
      const ch = event.voiceState.channel;

      ch.client.user.setPresence({ status: "online" });

      Logger.info(
        `User ${bold(
          event.voiceState.member?.user.username
        )} joined channel ${bold(ch.name)}`
      );

      subscriptionManager.ensureSubscribed(ch);

      await delay(500);
      player.playSound("hallo");
      break;
    }

    case "USER_SWITCHED": {
      Logger.info(
        `User ${bold(
          event.nextVoiceState.member?.user.username
        )} switched to channel ${bold(event.nextVoiceState.channel.name)}`
      );

      break;
    }

    case "USER_LEFT": {
      const ch = event.voiceState.channel;

      Logger.info(
        `User ${bold(
          event.voiceState.member?.user.username
        )} left channel ${bold(ch.name)}`
      );

      if (isChannelEmpty(ch)) {
        Logger.info(`Last user left, channel now empty`);
        subscriptionManager.destroy();
        ch.client.user.setPresence({ status: "invisible" });
      }

      break;
    }

    case "BOT": {
      break;
    }

    default:
      Logger.warn(`Unknown event`);
  }
}

function isChannelEmpty({ members }: VoiceBasedChannel): boolean {
  return (
    members.size === 0 || (members.size === 1 && !!members.at(0)?.user.bot)
  );
}
