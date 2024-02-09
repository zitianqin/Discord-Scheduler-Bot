/* eslint-disable brace-style */
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, ComponentType } = require('discord.js');
const { getData } = require('../../dataStore.js');
const { getScheduledMessageInfo, deleteScheduledMessage } = require('../../helperFunctions.js');

// Returns a string containing all the information that is to be displayed to the user about a scheduled message.
function getScheduledMessagesListContent(messageList, messageIndex) {
	if (messageList.length > 0) {
		return `Currently showing message ${messageIndex + 1} of ${messageList.length}.\n\n` + getScheduledMessageInfo(messageList[messageIndex]);
	}
	return 'You don\'t have any scheduled messages. You can schedule one with the `/schedule` command!';
}

// Returns an ActionRowBuilder object that contains the buttons for the user to interact with.
function makeRow(messageList, helpButton, editButton, deleteButton, previousButton, nextButton) {
	if (messageList.length === 0) {
		return new ActionRowBuilder().addComponents(helpButton);
	}
	return new ActionRowBuilder()
		.addComponents(editButton, deleteButton, previousButton, nextButton, helpButton);
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('messages')
		.setDescription('Gets a list of all the user\'s scheduled messages.'),

	async execute(interaction) {
		// Obtain array of user's scheduled messages
		const reminders = getData().reminders;
		const userId = interaction.user.id;
		const messageList = [];

		for (const reminder of reminders) {
			if (reminder.user.id === userId) {
				messageList.push(reminder);
			}
		}

		// Create response
		const editButton = new ButtonBuilder()
			.setCustomId('edit')
			.setLabel('Edit')
			.setStyle(ButtonStyle.Primary);

		const deleteButton = new ButtonBuilder()
			.setCustomId('delete')
			.setLabel('Delete')
			.setStyle(ButtonStyle.Danger);

		const previousButton = new ButtonBuilder()
			.setCustomId('previous')
			.setLabel('Previous')
			.setStyle(ButtonStyle.Secondary);

		const nextButton = new ButtonBuilder()
			.setCustomId('next')
			.setLabel('Next')
			.setStyle(ButtonStyle.Secondary);

		const helpButton = new ButtonBuilder()
			.setLabel('Help')
			.setURL('https://zitian.me/')
			.setStyle(ButtonStyle.Link);

		let messageIndex = 0;
		const response = await interaction.reply({
			content: getScheduledMessagesListContent(messageList, messageIndex),
			components: [makeRow(messageList, helpButton, editButton, deleteButton, previousButton, nextButton)],
			ephemeral: true,
		});

		// Manage user interactions with the buttons
		const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 3_600_000 });

		collector.on('collect', async i => {
			if (i.customId === 'edit') {
				await i.reply({ content: 'We haven\'t implemented the edit functionality yet!', ephemeral: true });

			} else if (i.customId === 'delete') {
				deleteScheduledMessage(messageList[messageIndex].id, userId, i);
				if (messageIndex > 0) {
					messageIndex--;
				}

			} else if (i.customId === 'previous') {
				if (messageIndex > 0) {
					messageIndex--;
				}

			} else if (i.customId === 'next') {
				if (messageIndex < messageList.length - 1) {
					messageIndex++;
				}
			}

			// Acknowledge the button interaction and edit the response.
			await i.deferUpdate();
			response.edit({
				content: getScheduledMessagesListContent(messageList, messageIndex),
				components: [makeRow(messageList, helpButton, editButton, deleteButton, previousButton, nextButton)],
				ephemeral: true,
			});
		});
	},
};
