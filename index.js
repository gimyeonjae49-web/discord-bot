const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const DATA_FILE = './attendance.json';

// =========================
// 데이터 로드/저장
// =========================
function loadData() {
    if (!fs.existsSync(DATA_FILE)) return {};
    const file = fs.readFileSync(DATA_FILE, 'utf8');
    if (!file) return {};
    return JSON.parse(file);
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// =========================
// 시간
// =========================
function getKST() {
    const now = new Date();
    const kst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));

    const y = kst.getFullYear();
    const m = String(kst.getMonth() + 1).padStart(2, '0');
    const d = String(kst.getDate()).padStart(2, '0');

    return {
    date: `${y}/${parseInt(m)}/${parseInt(d)}`,
    month: `${y}-${m}`,
    display: `${y}년 ${parseInt(m)}월 ${parseInt(d)}일`
};
}

// =========================
// 레벨
// =========================
function getLevel(points) {
    return Math.floor(points / 300) + 1;
}

// =========================
// 칭호
// =========================
function getTitle(count) {
    if (count >= 100) return '👑 전설';
    if (count >= 50) return '💎 달인';
    if (count >= 20) return '🌟 노력러';
    if (count >= 5) return '✨ 출석러';
    return '🌱 초보자';
}

// =========================
// 봇
// =========================
client.on('messageCreate', (msg) => {
    if (msg.author.bot) return;
    if (!msg.guild) return;

    const data = loadData();
    const user = msg.author.id;

    const tag = `<@${msg.author.id}>`; // 👈 파란 태그만 사용

    // =========================
    // 출첵
    // =========================
    if (msg.content === '!출첵') {

        const time = getKST();

        if (!data[user]) {
            data[user] = {
                last: "",
                total: 0,
                month: {},
                points: 0
            };
        }

        // 이미 출석
        if (data[user].last === time.date) {

            const embed = new EmbedBuilder()
                .setTitle('❌ 출석 실패')
                .setDescription(`공주님, 오늘은 이미 출석을 완료했어요 💖 \n내일 다시 와주세요!`)
                .setColor('#fc1f40');

            return msg.channel.send({
                embeds: [embed],
                allowedMentions: { users: [] }
            });
        }

        const oldLevel = getLevel(data[user].points);

        data[user].last = time.date;
        data[user].total += 1;

        if (!data[user].month[time.month]) {
            data[user].month[time.month] = 0;
        }
        data[user].month[time.month] += 1;

        data[user].points += 150;

        const newLevel = getLevel(data[user].points);

        saveData(data);

        const embed = new EmbedBuilder()
            .setTitle('✨ 공주 출석 완료 ✨')
            .setColor('#FFB6C1')
            .setDescription(`💖 공주님 ${msg.member.displayName} 출석 성공! 💖`)
            .addFields(
                {
                    name: '출석자',
                    value: tag,   // 👈 닉네임 없이 "태그만"
                    inline: false
                },
                { name: '날짜', value: time.display, inline: true },
                { name: '이번 달', value: `${data[user].month[time.month]}회`, inline: true },
                { name: '전체', value: `${data[user].total}회`, inline: true },
                { name: '포인트', value: `${data[user].points}P`, inline: true },
                { name: '레벨', value: `Lv.${newLevel}`, inline: true },
                { name: '칭호', value: `**${getTitle(data[user].total)}**`, inline: true }
            );

        msg.channel.send({
            embeds: [embed],
            allowedMentions: { users: [] } // 👈 알림 차단
        });

       
        
    }
});

client.once('ready', () => {
    console.log(`로그인 완료: ${client.user.tag}`);
});

client.login(process.env.TOKEN);