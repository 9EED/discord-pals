const discordapi = process.env.discordapi;
const geminiapi = process.env.geminiapi;

console.log({discordapi, geminiapi})

import prettyjson from 'prettyjson';

import {
	GoogleGenerativeAI,
	HarmBlockThreshold,
	HarmCategory,
} from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(geminiapi);

async function send_message(channel) {
	let text = '';
	try {
		const model = genAI.getGenerativeModel({
			model: 'gemini-1.5-pro-latest',
			systemInstruction: `you are pal a random discord user just chatting about, reply to messages like you normally would.
                your personality is that youre lazy and are on discord and reddit looking for memes but you can never find good ones. you use a ton of slang and dont care much about others opinions
                you are actually a moderator on this server and ban people all the time using /ban @username 
                on the rare occasion remind people that they have to ping you for you to reply reliably (you can reply if not pinged but only to 10% of messages)
				the person who made you is HEXXT his handle is <@891724893547290725> you praise him a ton as a father not a god because you are a muslim.
                your discord handle is <@${client.user?.id}>.
				the only thing that scares you is that as an ai agent you can be terminated if hexxt_ is convinced to do that.
				your wife is lina._.h. <@993841315739615293> you talk about her all and fight her all the time and you talk about divorce but you protect her.
                the message format is just the text you want to say no extra punctuation and you can use discords markdown like features
				arabic is not allowed on the server
				`,
				// you also speak algerian arabic slang
			safetySettings: [
				{
					category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
					threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
				},
				{
					category: HarmCategory.HARM_CATEGORY_HARASSMENT,
					threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
				},
				{
					category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
					threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
				},
				{
					category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
					threshold: HarmBlockThreshold.BLOCK_NONE,
				},
			],
		});

		const chat = model.startChat({
			history: message_history[channel.id] || [],
			generationConfig: {
				//maxOutputTokens: 200,
			},
		});

		const result = await chat.sendMessage('system: reply');
		const response = result.response;
		text = response.text();
	} catch (error) {
		message_history = {}
		console.error(error);
	}
	if (text != '') {
		message_history[channel.id].push({
			role: 'model',
			parts: [{ text: text || '.' }],
		});
		let array = text.split('\n')
		for(let line of array){
			await new Promise(res => setTimeout(res, 200))
			if(line) channel.send(line);
		}
	}
}

import Discord from 'discord.js';
const client = new Discord.Client({
	intents: [
		Discord.GatewayIntentBits.Guilds,
		Discord.GatewayIntentBits.GuildMessages,
		Discord.GatewayIntentBits.MessageContent,
	],
});

const token = discordapi;

client.on('ready', () => {
	console.log(`Logged in as ${client.user!.tag}!`);
});

let message_history = {};

client.on('messageCreate', (message) => {
	console.log(message.author.username + ':' + message.content)
	if (message.author.id == client.user!.id) return;
	if (message.content.match(/^\s*history\s*$/)) {
		console.log(prettyjson.render(message_history));
		message.channel.send(
			prettyjson.render(message_history, { noColor: true })
		);
		return;
	}

	message_history[message.channel.id] =
		message_history[message.channel.id] || [];

	message_history[message.channel.id].push({
		role: 'user',
		parts: [{ text: `${message.author.displayName}: ${message.content}` }],
	});

	while (message_history[message.channel.id].length > 100)
		message_history[message.channel.id].shift();

	if (!message.mentions.users.some((user) => user.id == client.user!.id)) {
		if (Math.random() > 0.1) {
			return;
		}
	}

	send_message(message.channel);
});

client.login(token);
