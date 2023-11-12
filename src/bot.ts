import "dotenv/config";
import {
  Client,
  Events,
  GatewayIntentBits,
  Partials,
  PresenceUpdateStatus,
} from "discord.js";
import { onVoiceStateUpdate } from "./voiceStateChanged";
import { Logger } from "./logger";
import { onMessage } from "./message";

function onReady(client: Client<true>): void {
  Logger.success(`Bot ${client.user.tag} is ready...`);
  client.user.setPresence({ status: PresenceUpdateStatus.Invisible });
}

export const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Channel, Partials.Message],
})
  .on(Events.VoiceStateUpdate, onVoiceStateUpdate)
  .on(Events.MessageCreate, onMessage)
  .once(Events.ClientReady, onReady);
