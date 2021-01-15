const Discord = require('discord.js');
const discordClient = new Discord.Client();
const {
    TOKEN,
    mongouri
} = process.env; //require('./config.json');
const fs = require('fs');
const article = fs.readFileSync("README.md").toString();

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

// 6. Schema 생성. (혹시 스키마에 대한 개념이 없다면, 입력될 데이터의 타입이 정의된 DB 설계도 라고 생각하면 됩니다.)
var user = mongoose.Schema({
    bot_id: String,
    userid: String,
    usercode: String,
    username: String,
    guild_id: String,
    guild_name: String,
    start_date: String,
    end_date: String,
    trial: Boolean,
    enable: Boolean,
    billing_info: Array,
    setting: {
        channels: Array
    }
});

// 7. 정의된 스키마를 객체처럼 사용할 수 있도록 model() 함수로 컴파일
const User = mongoose.model('user', user);

const dates = {
    convert:function(d) {
        // Converts the date in d to a date-object. The input can be:
        //   a date object: returned without modification
        //  an array      : Interpreted as [year,month,day]. NOTE: month is 0-11.
        //   a number     : Interpreted as number of milliseconds
        //                  since 1 Jan 1970 (a timestamp) 
        //   a string     : Any format supported by the javascript engine, like
        //                  "YYYY/MM/DD", "MM/DD/YYYY", "Jan 31 2009" etc.
        //  an object     : Interpreted as an object with year, month and date
        //                  attributes.  **NOTE** month is 0-11.
        return (
            d.constructor === Date ? d :
            d.constructor === Array ? new Date(d[0],d[1],d[2]) :
            d.constructor === Number ? new Date(d) :
            d.constructor === String ? new Date(d) :
            typeof d === "object" ? new Date(d.year,d.month,d.date) :
            NaN
        );
    },
    compare:function(a,b) {
        // Compare two dates (could be of any type supported by the convert
        // function above) and returns:
        //  -1 : if a < b
        //   0 : if a = b
        //   1 : if a > b
        // NaN : if a or b is an illegal date
        // NOTE: The code inside isFinite does an assignment (=).
        return (
            isFinite(a=this.convert(a).valueOf()) &&
            isFinite(b=this.convert(b).valueOf()) ?
            (a>b)-(a<b) :
            NaN
        );
    },
    inRange:function(d,start,end) {
        // Checks if date in d is between dates in start and end.
        // Returns a boolean or NaN:
        //    true  : if d is between start and end (inclusive)
        //    false : if d is before start or after end
        //    NaN   : if one or more of the dates is illegal.
        // NOTE: The code inside isFinite does an assignment (=).
       return (
            isFinite(d=this.convert(d).valueOf()) &&
            isFinite(start=this.convert(start).valueOf()) &&
            isFinite(end=this.convert(end).valueOf()) ?
            start <= d && d <= end :
            NaN
        );
    }
}
Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

const replies = require('./replies.json');
const bot_id = 1;
const bot_name = '격려 봇';

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //최댓값은 제외, 최솟값은 포함
}
const randomMessage = function(msgList){
    return msgList[getRandomInt(0, msgList.length)];
}

const leave = (guild)=>{
    if(guild === null){
        console.log('guild is null');
        return;
    }else{
        User.findOne({bot_id: bot_id, guild_id: guild.id}, async (err, data)=>{
            if(err){
                console.log(err);
            }else{
                if(data === null){
                    guild.owner
                    .send(`${guild.name}에서 ${bot_name}이 비활성화 되었습니다.\n http://bot-market.kro.kr/ 에서 구독 결제 후 다시 초대해주시기 바랍니다.`)
                    .then((msg)=>{
                        guild.leave()
                        .catch(err => {
                            console.log(`there was an error leaving the guild: \n ${err.message}`);
                        });
                    });
                }else{
                    const now = new Date();
                    const { end_date } = data;
                    if(now > end_date.addDays(1)){
                        guild.owner
                        .send(`${guild.name}에서 ${bot_name}이 비활성화 되었습니다.\n http://bot-market.kro.kr/ 에서 구독 결제 후 다시 초대해주시기 바랍니다.`)
                        .then((msg)=>{
                            guild.leave()
                            .catch(err => {
                                console.log(`there was an error leaving the guild: \n ${err.message}`);
                            });
                        });
                    }
                }
            }
        });
    }
};

discordClient.on('ready', () => {
  console.log(`Logged in as ${discordClient.user.tag}!`);
});

discordClient.on('message', msg => {
    const { author, channel, guild, content } = msg;
    if(author.bot) return;

    leave(guild);
    
    User.findOne({bot_id: bot_id, guild_id: guild.id}, (err, data)=>{
        if(err){
            console.log(err);
        }else{
            const { channels } = data.setting;
            if(channels.includes(channel.name) || channels.includes('*')){
                if(content.includes('도움말')){
                    channel.send("\`\`\`"+article+"\`\`\`");
                    return;
                }else{
                    msg.reply(randomMessage(replies));
                }
            }
        }
    });
});

discordClient.on("error", () => { console.log("error"); });

discordClient.login(TOKEN);