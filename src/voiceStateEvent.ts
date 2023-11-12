import { VoiceState, VoiceBasedChannel, GuildMember } from "discord.js";

export function asEvent(
  prev: VoiceState,
  next: VoiceState
): VoiceStateChangedEvent {
  if (prev.member?.user.bot || next.member?.user.bot) {
    return {
      status: "BOT",
    };
  }

  if (prev.channel === null && next.channel !== null) {
    return {
      status: "USER_JOINED",
      voiceState: next,
    } as UserJoinedEvent;
  }

  if (
    prev.channel !== null &&
    next.channel !== null &&
    prev.channelId !== next.channelId
  ) {
    return {
      status: "USER_SWITCHED",
      prevVoiceState: prev,
      nextVoiceState: next,
    } as UserSwitchedEvent;
  }

  if (prev.channel !== null && next.channel === null) {
    return {
      status: "USER_LEFT",
      voiceState: prev,
    } as UserLeftEvent;
  }

  return {
    status: "UNKNOWN",
    prevVoiceState: prev,
    nextVoiceState: next,
  };
}

interface BotEvent {
  readonly status: "BOT";
}

interface UnknownEvent {
  readonly status: "UNKNOWN";
  readonly prevVoiceState: VoiceState;
  readonly nextVoiceState: VoiceState;
}

interface UserJoinedEvent {
  readonly status: "USER_JOINED";
  readonly voiceState: VoiceState & {
    readonly channel: VoiceBasedChannel;
    readonly member: GuildMember;
  };
}

interface UserSwitchedEvent {
  readonly status: "USER_SWITCHED";
  readonly prevVoiceState: VoiceState & {
    readonly channel: VoiceBasedChannel;
    readonly member: GuildMember;
  };
  readonly nextVoiceState: VoiceState & {
    readonly channel: VoiceBasedChannel;
    readonly member: GuildMember;
  };
}

interface UserLeftEvent {
  readonly status: "USER_LEFT";
  readonly voiceState: VoiceState & {
    readonly channel: VoiceBasedChannel;
    readonly member: GuildMember;
  };
}

export type VoiceStateChangedEvent =
  | UserJoinedEvent
  | UserSwitchedEvent
  | UserLeftEvent
  | BotEvent
  | UnknownEvent;
