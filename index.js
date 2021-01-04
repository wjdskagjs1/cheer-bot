const Discord = require('discord.js');
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
const fs = require('fs');
const article = fs.readFile("README.md").toString();

let replies = require("./replies.json");

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //최댓값은 제외, 최솟값은 포함
}
const randomMessage = function(msgList){
    return msgList[getRandomInt(0, msgList.length)];
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    const {content, channel, author} = msg;

    if(channel.name !== '격려-봇' || author.bot ){
        return;
    }
    if(content.includes('도움말')){
        channel.send("\`\`\`"+article+"\`\`\`");
        return;
    }

    msg.reply(randomMessage(replies));
});

client.login(process.env.TOKEN);