import {
    Client,
    CommandInteraction,
    SlashCommandBuilder,
    SlashCommandOptionsOnlyBuilder,
} from 'discord.js';
import { supabase } from '..';

class DiscordCommand {
    data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder = new SlashCommandBuilder().setName(
        'command_base',
    );
    constructor(data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder) {
        this.data = data;
    }

    /** Create user account if doesn't exist already */
    async createUser(interaction: CommandInteraction): Promise<void> {
        // Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('id', interaction.user.id)
            .single();

        if (!existingUser) {
            await supabase.from('users').insert([{ id: interaction.user.id, gems: 100 }]);
        }
    }

    async preExecute(interaction: CommandInteraction): Promise<void> {
        await this.createUser(interaction);
    }

    async execute(interaction: CommandInteraction, client: Client): Promise<void> {}

    async runCommand(interaction: CommandInteraction, client: Client): Promise<void> {
        await this.preExecute(interaction);

        await this.execute(interaction, client);
    }
}

export default DiscordCommand;
