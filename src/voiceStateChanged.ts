import {
  PresenceUpdateStatus,
  User,
  VoiceBasedChannel,
  VoiceState,
} from "discord.js";

import { subscriptionManager } from "./connection";
import { VoiceStateChangedEvent, asEvent } from "./voiceStateEvent";
import { Logger } from "./logger";
import { bold } from "chalk";
import { player } from "./audio";
import { delay } from "./utils";
import { bot } from "./bot";

export function onVoiceStateUpdate(prev: VoiceState, next: VoiceState): void {
  onVoiceStateEvent(asEvent(prev, next));
}

interface GhettoUser extends User {
  // TODO: ideally, this tracks last joined *per channel*
  lastJoinedAt?: number;
}

const USER_WELCOME_TIMEOUT = 15_000;

async function onVoiceStateEvent(event: VoiceStateChangedEvent): Promise<void> {
  switch (event.status) {
    case "USER_JOINED": {
      const ch = event.voiceState.channel;

      if (
        bot.user === null ||
        (ch.members.size > 1 && !ch.members.has(bot.user.id))
      )
        return;

      if (ch.client.user.presence.status !== PresenceUpdateStatus.Online) {
        ch.client.user.setPresence({ status: PresenceUpdateStatus.Online });
      }

      const newUser = event.voiceState.member?.user as GhettoUser;

      Logger.info(
        `User ${bold(newUser.username)} joined channel ${bold(ch.name)}`
      );

      const now = Date.now();

      if (now - (newUser.lastJoinedAt ?? 0) > USER_WELCOME_TIMEOUT) {
        subscriptionManager.ensureSubscribed(ch);

        await delay(500);
        player.playSound("HALLO");
      }

      newUser.lastJoinedAt = now;

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
        ch.client.user.setPresence({ status: PresenceUpdateStatus.Invisible });
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
