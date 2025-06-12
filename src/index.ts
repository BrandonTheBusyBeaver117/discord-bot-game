import { Client } from 'discord.js';
import config from './config';

import mongoConfig from './mongoConfig';
import { connect } from 'mongoose';
import DiscordCommand from './commands/discord_command';
import { getCommandMappings } from './getCommands';
import { createClient } from '@supabase/supabase-js';

import * as dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: ['Guilds', 'GuildMessages', 'DirectMessages'] });

export const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

let commandMappings: Map<string, DiscordCommand> = null;

client.once('ready', async (readyClient) => {
    commandMappings = await getCommandMappings();

    if (!mongoConfig.MONGODB_URL) return;

    try {
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
            console.log('Missing Supabase environment variables');
            process.exit(1);
        }
        // Maybe we should try to connect with supabse...
        // await connect(mongoConfig.MONGODB_URL);

        // if (connect) {
        //     console.log('connected to db');
        // } else {
        //     console.log('failed to connect to db');
        // }
        console.log(`Both db and bot is up and running!`);
        console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    } catch (err) {
        console.log('MongoDB connection error. Please make sure MongoDB is running. ' + err);
        process.exit();
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) {
        console.error('Interaction is not a command');
        return;
    }

    if (!commandMappings) {
        console.error('No command mappings');
        return;
    }

    // Bro, what a fancy way to do this lol
    const { commandName } = interaction;

    const command: DiscordCommand = commandMappings.get(commandName);

    if (!command) {
        console.error(`No command matching ${commandName} was found.`);
        return;
    }

    try {
        command.runCommand(interaction, client);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: 'There was an error while executing this command!',
                ephemeral: true,
            });
        } else {
            await interaction.reply({
                content: 'There was an error while executing this command!',
                ephemeral: true,
            });
        }
    }
});

client.login(config.DISCORD_TOKEN);
