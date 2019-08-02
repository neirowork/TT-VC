require('dotenv').config();
import Discord from 'discord.js';

interface ConnectionPool {
  channel: string;
  connection: void | Discord.VoiceConnection;
}

const GOOD_EMOJI = ':white_check_mark:';
const BAD_EMOJI = ':thinking:';

class TTVCBot {
  private token!: string;
  private bot!: Discord.Client;
  private conPool: {
    [key: string]: ConnectionPool;
  } = {};

  constructor(token: string | undefined) {
    if (!token) {
      throw new ReferenceError('トークンがセットされていません。');
    }

    this.token = token;
    this.bot = new Discord.Client();
  }

  public start() {
    this.bot.login(this.token);
    console.log('… ログインしています。');

    this.handleReady();
    this.handleError();
    this.handleMessage();
  }

  private handleReady() {
    this.bot.on('ready', () => console.log('✔ ログインしました！'));
  }

  private handleError() {
    this.bot.on('error', error => console.error(error));
  }

  private handleMessage() {
    this.bot.on('message', (msg: Discord.Message) => {
      if (!msg.guild) return;
      if (msg.author.id === this.bot.user.id) return;

      const args = msg.content.match(/^>(.+)>$/);

      if (args) {
        switch (args[1]) {
          case 'ping':
            msg.channel.send(this.mentionMessage(msg.author.id, 'pong!'));
            break;

          case 'join':
            this.handleJoin(msg);
            break;

          case 'leave':
            this.handleLeave(msg);
            break;

          case 'h-leave':
            this.handleHardLeave(msg);
            break;

          default:
            msg.channel.send(
              this.mentionMessage(
                msg.author.id,
                `${BAD_EMOJI} \`${args[1]}\`というコマンドはありません。`
              )
            );
        }

        return;
      }

      this.handleChat(msg);
    });
  }

  private async handleJoin(msg: Discord.Message) {
    const vc: Discord.VoiceChannel = msg.member.voiceChannel;

    if (!vc) {
      msg.channel.send(
        this.mentionMessage(
          msg.author.id,
          `${BAD_EMOJI} 先にVCへ参加してください。`
        )
      );

      return;
    }

    this.conPool[msg.guild.id] = {
      channel: msg.channel.id,
      connection: await vc.join().catch(error => {
        msg.channel.send(
          this.mentionMessage(
            msg.author.id,
            `${BAD_EMOJI} VCに参加できませんでした。`
          )
        );
      })
    };

    const ch: Discord.GuildChannel | undefined = msg.guild.channels.get(
      msg.channel.id
    );

    if (!ch) return;

    msg.channel.send(
      `${GOOD_EMOJI} **:microphone2: ${vc.name} <- :link: -- :speech_balloon: ${ch.name}** に接続しました！`
    );
  }

  private handleLeave(msg: Discord.Message) {
    if (!this.conPool[msg.guild.id]) {
      msg.member.voiceChannelID;
      msg.channel.send(
        this.mentionMessage(
          msg.author.id,
          `${BAD_EMOJI} 既に切断されています。`
        )
      );
      return;
    }

    this.leaveVC(msg.guild.id);
    msg.channel.send(`${GOOD_EMOJI} 切断しました！`);
  }

  private async handleHardLeave(msg: Discord.Message) {
    const vc = msg.member.voiceChannel;
    if (!vc) {
      msg.channel.send(
        this.mentionMessage(
          msg.author.id,
          `${BAD_EMOJI} 先にVCへ参加してください。`
        )
      );

      return;
    }

    (await vc.join()).disconnect();
    msg.channel.send(`${GOOD_EMOJI} 強制的に切断しました！`);
  }

  private handleChat(msg: Discord.Message) {
    const pool = this.conPool[msg.guild.id];
    if (!pool || !pool.connection || msg.channel.id !== pool.channel) return;
    if (msg.content.startsWith('>')) return;

    pool.connection
      .playArbitraryInput(
        `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ja&q=${encodeURIComponent(
          this.removeURL(msg.content)
        ) + '。。。。。。。。。。'}`
      )
      .setVolume(1);
  }

  private leaveVC(guildId: string) {
    const pool = this.conPool[guildId];
    if (!pool || !pool.connection) return;

    pool.connection.disconnect();
    pool.channel = '';
  }

  private mentionMessage(userId: string, message: string) {
    return `<@!${userId}> ${message}`;
  }

  private removeURL(msg: string) {
    return msg
      .replace(/https?:\/\/[\w\/:%#\$&\?\(\)~\.=\+\-]+ ?/gim, 'URL省略')
      .replace(/<.+>/gim, '');
  }
}

const ttvc = new TTVCBot(process.env.DISCORD_TOKEN);
ttvc.start();
