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
  lastWelcomeAt?: number;
  lastFarewellAt?: number;
}

const USER_GREET_TIMEOUT = 15_000;

async function onVoiceStateEvent(event: VoiceStateChangedEvent): Promise<void> {
  if (bot.user === null) {
    return;
  }
  switch (event.status) {
    case "USER_JOINED": {
      const ch = event.voiceState.channel;

      if (ch.members.size > 1 && !ch.members.has(bot.user.id)) return;

      if (bot.user.presence.status !== PresenceUpdateStatus.Online) {
        bot.user.setPresence({ status: PresenceUpdateStatus.Online });
      }

      return welcomeUser(event.voiceState.member.user, ch);
    }

    case "USER_SWITCHED": {
      const ch = event.nextVoiceState.channel;

      if (isChannelEmpty(event.prevVoiceState.channel)) {
        Logger.info(`Last user switched, channel now empty`);

        subscriptionManager.destroy();
        subscriptionManager.ensureSubscribed(event.nextVoiceState.channel);
        return;
      }

      if (!ch.members.has(bot.user.id)) {
        return;
      }

      return welcomeUser(event.nextVoiceState.member.user, ch, true);
    }

    case "USER_LEFT": {
      const ch = event.voiceState.channel;

      if (!isChannelEmpty(ch)) {
        return farewellUser(event.voiceState.member.user, ch);
      }

      Logger.info(`Last user left, channel now empty`);
      subscriptionManager.destroy();
      bot.user.setPresence({ status: PresenceUpdateStatus.Invisible });

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
    members.size === 0 ||
    (members.size === 1 && members.at(0)?.user === bot.user)
  );
}

async function welcomeUser(
  user: GhettoUser,
  ch: VoiceBasedChannel,
  switched?: boolean
): Promise<void> {
  Logger.info(
    `User ${bold(user.username)} ${
      switched ? "switched to" : "joined"
    } channel ${bold(ch.name)}`
  );

  const now = Date.now();

  if (now - (user.lastWelcomeAt ?? 0) > USER_GREET_TIMEOUT) {
    subscriptionManager.ensureSubscribed(ch);

    await delay(500);
    player.playSound("HALLO", true);
  }

  user.lastWelcomeAt = now;
}

async function farewellUser(
  user: GhettoUser,
  ch: VoiceBasedChannel
): Promise<void> {
  Logger.info(`User ${bold(user.username)} left channel ${bold(ch.name)}`);

  const now = Date.now();

  if (now - (user.lastFarewellAt ?? 0) > USER_GREET_TIMEOUT) {
    player.playSound("bye_bye", true);
  }

  user.lastFarewellAt = now;
}
