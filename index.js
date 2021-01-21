const Discord = require('discord.js');
const discordClient = new Discord.Client();
const {
    TOKEN,
    mongouri
} = require('./config.json');
const fs = require('fs');
const article = fs.readFileSync("README.txt").toString();

const mongoose = require('mongoose');

const connectionParams={
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true 
};
mongoose.connect(mongouri, connectionParams)
.then( () => {
    console.log('Connected to database ');
})
.catch( (err) => {
    console.error(`Error connecting to the database. \n${err}`);
});

const replies = require('./replies.json');
const bot_id = 1;
const bot_name = '격려 봇';

// 6. Schema 생성. (혹시 스키마에 대한 개념이 없다면, 입력될 데이터의 타입이 정의된 DB 설계도 라고 생각하면 됩니다.)
var setting = mongoose.Schema({
    bot_id: Number,
    ownerID: String,
    owner_name: String,
    guild_id: String,
    guild_name: String,
    channel: String,
});

// 7. 정의된 스키마를 객체처럼 사용할 수 있도록 model() 함수로 컴파일
const Setting = mongoose.model(`bot${bot_id}`, setting);

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //최댓값은 제외, 최솟값은 포함
}
const randomMessage = function(msgList){
    return msgList[getRandomInt(0, msgList.length)];
}

discordClient.on('ready', () => {
  console.log(`Logged in as ${discordClient.user.tag}!`);
});

discordClient.on('message', msg => {
    const { author, member, channel, guild, content } = msg;
    if(author.bot) return;

    const admin = member.permissions.has("ADMINISTRATOR");

    const prefix = '=';

    if(content.includes(`${prefix}도움말`)){
        channel.send("\`\`\`"+article+"\`\`\`");
        return;
    }
    if(content.includes(`${prefix}debugger`)){
        channel.send('debug : '+admin);
    }

    Setting.findOne({bot_id: bot_id, guild_id: guild.id}, (err, data)=>{
        if(err){
            console.log(err);
        }else{
            if(data === null){
                if(content.startsWith(`${prefix}채널 `) && admin){
                    const newChannel = content.replace(`${prefix}채널 `, '');
                    const newSetting = new Setting({
                        bot_id: bot_id,
                        ownerID: guild.ownerID || '',
                        owner_name: guild.owner ? guild.owner.user.tag : '',
                        guild_id: guild.id,
                        guild_name: guild.name,
                        channel: newChannel,
                    });
                    newSetting.save(function(error, data){
                        if(error){
                            console.log(error);
                            channel.send("저장 안됐어.");
                        }else{
                            channel.send("저장 했어.");
                        }
                    });
                }
            }else{
                if(content.startsWith(`${prefix}채널 `) && admin){
                    const newChannel = content.replace(`${prefix}채널 `, '');
                    Setting.updateOne({
                        bot_id: bot_id,
                        guild_id: guild.id,
                    }, { $set: { channel: newChannel } },(err, data)=>{
                        if(err){
                            console.log(err);
                            channel.send("저장 안됐어.");
                        }else{
                            channel.send("저장 했어.");
                        }
                    });
                    return;
                }
            }
            const setting_channel = data.channel;
            if(setting_channel === channel.name || setting_channel === '*'){
                msg.reply(randomMessage(replies));
            }
        }
    });
});

discordClient.on("error", () => { console.log("error"); });

discordClient.login(TOKEN);