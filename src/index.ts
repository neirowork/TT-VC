require('dotenv').config()
import Discord from 'discord.js'

class TTVCBot {
  private token!: string
  private bot!: Discord.Client

  constructor(token: string | undefined) {
    if (!token) {
      throw new ReferenceError('トークンがセットされていません。')
    }

    this.token = token
    this.bot = new Discord.Client()
  }

  public start() {
    this.bot.login(this.token)
    console.log('… ログインしています。')

    this.handleReady()
    this.handleError()
    this.handleMessage()
  }

  private handleReady() {
    this.bot.on('ready', () => console.log('✔ ログインしました。'))
  }

  private handleError() {
    this.bot.on('error', error => console.error(error))
  }

  private handleMessage() {
    this.bot.on('message', (msg: Discord.Message) => {
      if (!msg.guild) return
      if (msg.author.id === this.bot.user.id) return

      switch (msg.content) {
        case '<ping>':
          msg.channel.send(`<@!${msg.author.id}> pong!`)
          break
      }
    })
  }
}

const ttvc = new TTVCBot(process.env.DISCORD_TOKEN)
ttvc.start()
