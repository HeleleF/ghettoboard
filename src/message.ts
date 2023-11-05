import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Message,
} from "discord.js";
import { player } from "./audio";
import { Logger } from "./logger";
import { subscriptionManager } from "./connection";
import { bot } from "./bot";

export async function onMessage(message: Message): Promise<void> {
  if (message.author === bot.user) return;

  const text = await covertToText(message);
  if (!text) return;

  if (text === "all") {
    const all = await player.available();
    message.reply(all);
    return;
  }

  if (!subscriptionManager.subscribed()) {
    message.reply("Ghettoboard not in voice!");
    return;
  }

  Logger.info(`Attempting to play sound ${text}`);
  player.playSound(text);
}

async function covertToText(message: Message): Promise<string> {
  const content = message.partial
    ? await message
        .fetch()
        .then((m) => m.cleanContent)
        .catch(() => "")
    : message.cleanContent;

  return content.trim();
}
