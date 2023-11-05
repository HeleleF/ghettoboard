import { player } from "./audio";
import { bot } from "./bot";
import { subscriptionManager } from "./connection";
import { Logger } from "./logger";

bot.login(process.env.DISCORD_TOKEN);

function terminate() {
  subscriptionManager.destroy();
  player.stop();
  bot.destroy();

  Logger.success("Bot stopped.");

  process.exit();
}

process.on("SIGINT", terminate);
