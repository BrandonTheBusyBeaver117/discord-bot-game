import {
    AutocompleteInteraction,
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

    async autocomplete(interaction: AutocompleteInteraction): Promise<void> {}

    async preExecute(interaction: CommandInteraction): Promise<void> {
        await this.createUser(interaction);
    }

    // Any sort of cleanup or anything
    async onSuccess(interaction: CommandInteraction): Promise<void> {}

    // Basically, only need to return true on a successful execution
    async execute(interaction: CommandInteraction, client: Client): Promise<void | boolean> {}

    async runCommand(interaction: CommandInteraction, client: Client): Promise<void> {
        await this.preExecute(interaction);

        const success = await this.execute(interaction, client);

        if (success) {
            await this.onSuccess(interaction);
        }
    }
}

export default DiscordCommand;
