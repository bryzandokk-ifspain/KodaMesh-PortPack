const {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    AttachmentBuilder,
    ChannelType,
    EmbedBuilder
} = require('discord.js');

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const unzipper = require('unzipper');

const zlib = require('node:zlib');

const { exec } = require('child_process');

const util = require('util');

const execPromise = util.promisify(exec);
const zstdCompressAsync = util.promisify(zlib.zstdCompress);


// ============================================================
// CONFIG
// ============================================================

const VALID_SIZES = [
    16,
    32,
    64,
    128,
    256,
    512
];

const FINAL_SIZE = 1024;

const CONCURRENCY = 8;

const MAX_RETRIES = 2;
const RETRY_BASE_DELAY = 800;

const BLENDER_TIMEOUT = 90000;

const ASSET_POLL_INTERVAL = 500;
const ASSET_POLL_ATTEMPTS = 180;

const LUAU_POLL_INTERVAL = 500;
const LUAU_POLL_ATTEMPTS = 240;

const BLENDER_PATH =
    'C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe';

const UNIVERSE_ID =
    '10764746325';

const PLACE_ID =
    '113531224892646';


// ============================================================
// MESH ROTATIONS
// ============================================================

const ROTATION_X = 90;
const ROTATION_Y = -45;
const ROTATION_Z = 0;


// ============================================================
// PATHS
// ============================================================

const ITEMS_PATH =
    'assets/minecraft/textures/items';

const WOOL_PATH =
    'assets/minecraft/textures/blocks';

const SKY_PATH =
    'assets/minecraft/mcpatcher/sky/world0';

const GUI_ICONS_PATH =
    'assets/minecraft/textures/gui/icons.png';


// ============================================================
// REQUIRED ITEM IMAGES
// ============================================================

const REQUIRED_IMAGES = [

    'apple_golden.png',

    'bow_pulling_0.png',
    'bow_pulling_1.png',
    'bow_pulling_2.png',
    'bow_standby.png',

    'diamond.png',
    'diamond_sword.png',
    'diamond_pickaxe.png',

    'diamond_axe.png',

    'emerald.png',

    'ender_pearl.png',

    'gold_sword.png',
    'gold_pickaxe.png',

    'gold_axe.png',

    'iron_ingot.png',
    'iron_sword.png',
    'iron_pickaxe.png',

    'iron_axe.png',

    'wood_pickaxe.png',
    'wood_sword.png',

    'wood_axe.png',

    'shears.png',

    'potion_bottle_empty.png',

    'fireball.png'

];


// ============================================================
// OPTIONAL WOOL IMAGES
// ============================================================

const WOOL_IMAGES = [

    'wool_colored_green.png',
    'wool_colored_blue.png',
    'wool_colored_orange.png',
    'wool_colored_gray.png',
    'wool_colored_cyan.png',
    'wool_colored_yellow.png',
    'wool_colored_purple.png',
    'wool_colored_red.png'

];


// ============================================================
// WOOL MAPPING
// ============================================================

const WOOL_MAPPINGS = {

    'wool_colored_green.png':
        'ClayGreen',

    'wool_colored_blue.png':
        'ClayBlue',

    'wool_colored_orange.png':
        'ClayOrange',

    'wool_colored_gray.png':
        'ClayGrey',

    'wool_colored_cyan.png':
        'ClayCyan',

    'wool_colored_yellow.png':
        'ClayYellow',

    'wool_colored_purple.png':
        'ClayPurple',

    'wool_colored_red.png':
        'ClayRed'

};


// ============================================================
// SKY SOURCES
// ============================================================

const SKY_SOURCES = [

    'cloud1.png',
    'cloud2.png',
    'starfield01.png',
    'starfield02.png',
    'starfield03.png',
    'starfield04.png',
    'skybox.png',
    'skybox1.png',
    'skybox2.png',
    'skybox3.png',
    'starfield.png'

];


// ============================================================
// SKY MAPPING
// ============================================================

const SKY_MAPPINGS = {

    bottom: 'SkyBottom',
    top: 'SkyTop',
    left: 'SkyLeft',
    back: 'SkyBack',
    right: 'SkyRight',
    front: 'SkyFront'

};


// ============================================================
// ITEM MAPPING
// ============================================================

const IMAGE_MAPPINGS = {

    'bow_standby.png': {
        mesh: ['Bow0Mesh'],
        texture: ['Bow0Texture']
    },

    'bow_pulling_0.png': {
        mesh: ['Bow1Mesh'],
        texture: ['Bow1Texture']
    },

    'bow_pulling_1.png': {
        mesh: ['Bow2Mesh'],
        texture: ['Bow2Texture']
    },

    'bow_pulling_2.png': {
        mesh: ['Bow3Mesh'],
        texture: ['Bow3Texture']
    },

    'diamond.png': {
        mesh: ['DiamondMesh'],
        texture: [
            'DiamondTexture',
            'DiamondVPImage'
        ]
    },

    'diamond_sword.png': {
        mesh: ['SwordMesh'],
        texture: [
            'DiamondSwordTexture',
            'DiamondSwordVPImage'
        ]
    },

    'emerald.png': {
        mesh: ['EmeraldMesh'],
        texture: [
            'EmeraldTexture',
            'EmeraldVPImage'
        ]
    },

    'ender_pearl.png': {
        mesh: ['PearlMesh'],
        texture: [
            'PearlTexture',
            'PearlVPImage'
        ]
    },

    'gold_sword.png': {
        mesh: [],
        texture: [
            'GoldSwordTexture',
            'GoldSwordVPImage'
        ]
    },

    'iron_sword.png': {
        mesh: [],
        texture: [
            'SwordTexture',
            'SwordVPImage'
        ]
    },

    'wood_sword.png': {
        mesh: [],
        texture: [
            'WoodenSwordTexture',
            'WoodenSwordVPImage'
        ]
    },

    'diamond_pickaxe.png': {
        mesh: ['PickaxeMesh'],
        texture: [
            'DiamondPickaxeTexture',
            'DiamondPickaxeVPImage'
        ]
    },

    'gold_pickaxe.png': {
        mesh: [],
        texture: [
            'GoldPickaxeTexture',
            'GoldPickaxeVPImage'
        ]
    },

    'iron_pickaxe.png': {
        mesh: [],
        texture: [
            'PickaxeTexture',
            'PickaxeVPImage'
        ]
    },

    'wood_pickaxe.png': {
        mesh: [],
        texture: [
            'WoodenPickaxeTexture',
            'WoodenPickaxeVPImage'
        ]
    },

    'apple_golden.png': {
        mesh: ['GoldAppleMesh'],
        texture: [
            'GoldAppleTexture',
            'GoldAppleVPImage'
        ]
    },

    'iron_ingot.png': {
        mesh: ['IronMesh'],
        texture: [
            'IronTexture',
            'IronVPImage'
        ]
    },

    'diamond_axe.png': {
        mesh: ['AxeMesh'],
        texture: [
            'DiamondAxeTexture',
            'DiamondAxeVPImage'
        ]
    },

    'gold_axe.png': {
        mesh: [],
        texture: [
            'GoldAxeTexture',
            'GoldAxeVPImage'
        ]
    },

    'iron_axe.png': {
        mesh: [],
        texture: [
            'AxeTexture',
            'AxeVPImage'
        ]
    },

    'wood_axe.png': {
        mesh: [],
        texture: [
            'WoodenAxeTexture',
            'WoodenAxeVPImage'
        ]
    },

    'shears.png': {
        mesh: ['ShearsMesh'],
        texture: [
            'ShearsTexture',
            'ShearsVPImage'
        ]
    },

    'potion_bottle_empty.png': {
        mesh: [
            'SpeedPotionMesh',
            'JumpPotionMesh'
        ],
        texture: [
            'SpeedPotionTexture',
            'SpeedPotionVPImage',
            'JumpPotionTexture',
            'JumpPotionVPImage'
        ]
    },

    'fireball.png': {
        mesh: ['FireballMesh'],
        texture: [
            'FireballTexture',
            'FireballVPImage'
        ]
    }

};


const RESOURCE_OPTIONS = [

    ...REQUIRED_IMAGES.map(
        imageName => ({
            value:
                `item:${imageName}`,

            label:
                getResourceLabel(
                    imageName
                ),

            description:
                `${ITEMS_PATH}/${imageName}`,

            emoji:
                '🧩'
        })
    ),

    ...WOOL_IMAGES.map(
        woolName => ({
            value:
                `wool:${woolName}`,

            label:
                getResourceLabel(
                    woolName
                ),

            description:
                `${WOOL_PATH}/${woolName}`,

            emoji:
                '🧶'
        })
    ),

    {
        value: 'sky',
        label: 'Sky',
        description:
            `${SKY_PATH}/ • then select the skyy`,
        emoji: '🌌'
    },

    {
        value: 'crosshair',
        label: 'Crosshair',
        description:
            GUI_ICONS_PATH,
        emoji: '🎯'
    }

];



// ============================================================
// BASE PACK
// ============================================================

const BASE_PACK = {

    "BlocksVPImage": "0",
    "BowVPImage": "0",

    "Bow0Mesh": "92849804961177",
    "Bow0Texture": "106315283135757",

    "Bow1Mesh": "113841984909100",
    "Bow1Texture": "117405975573361",

    "Bow2Mesh": "117114136945069",
    "Bow2Texture": "136738607219656",

    "Bow3Mesh": "83076991106180",
    "Bow3Texture": "108462418050816",

    "DefaultBowRotation": [
        3,
        10,
        0
    ],

    "DefaultBowScale": [
        2.25,
        2.25,
        2.25
    ],

    "DefaultBowVPImage": "125562846132623",

    "DiamondMesh": "89942433665877",

    "DiamondPickaxeTexture": "100600191665018",
    "DiamondPickaxeVPImage": "79286119024383",

    "DiamondRotation": [
        0,
        0,
        -35
    ],

    "DiamondScale": [
        1.75,
        1.75,
        1.75
    ],

    "DiamondSwordTexture": "70607247755398",
    "DiamondSwordVPImage": "121813241620253",

    "DiamondTexture": "110971495548600",
    "DiamondVPImage": "80980212931542",

    "EmeraldMesh": "103144736944926",

    "EmeraldRotation": [
        0,
        0,
        -35
    ],

    "EmeraldScale": [
        1.75,
        1.75,
        1.75
    ],

    "EmeraldTexture": "76814700693963",
    "EmeraldVPImage": "114574104351628",

    "GoldAppleEatingScale": [
        2,
        2,
        2
    ],

    "GoldAppleMesh": "102080395642844",

    "GoldAppleRotation": [
        0,
        -90,
        0
    ],

    "GoldAppleScale": [
        2,
        2,
        2
    ],

    "GoldAppleTexture": "134804404631534",
    "GoldAppleVPImage": "87840797652428",

    "GoldPickaxeTexture": "100702988360136",
    "GoldPickaxeVPImage": "93648784178538",

    "GoldSwordTexture": "128274654568144",
    "GoldSwordVPImage": "102241119116435",

    "IronMesh": "140129701237490",

    "IronRotation": [
        0,
        0,
        -35
    ],

    "IronScale": [
        1.5,
        1.5,
        1.5
    ],

    "IronTexture": "92208499998673",
    "IronVPImage": "75536662764889",

    "PearlMesh": "0",
    "PearlTexture": "0",
    "PearlVPImage": "0",

    "PearlRotation": [
        0,
        0,
        -35
    ],

    "PickaxeMesh": "125989025789786",

    "PickaxeRotation": [
        0,
        0,
        0
    ],

    "PickaxeScale": [
        2,
        2,
        2
    ],

    "PickaxeTexture": "133923679754669",
    "PickaxeVPImage": "85938952726145",

    "ReducedBlockLag": true,

    "SwordBlockingRotation": [
        -45,
        110,
        -30
    ],

    "SwordBlockingScale": [
        2,
        2,
        2
    ],

    "SwordMesh": "122647348621426",

    "SwordRotation": [
        0,
        -180,
        0
    ],

    "SwordScale": [
        2,
        2,
        2
    ],

    "SwordTexture": "97652904601266",
    "SwordVPImage": "85738183333201",

    "WoodenPickaxeTexture": "130067289543263",
    "WoodenPickaxeVPImage": "81722050094564",

    "WoodenSwordTexture": "95597552216546",
    "WoodenSwordVPImage": "137681027313560",

    "AxeMesh": "0",

    "AxeRotation": [
        0,
        180,
        0
    ],

    "DiamondAxeTexture": "0",
    "DiamondAxeVPImage": "0",

    "GoldAxeTexture": "0",
    "GoldAxeVPImage": "0",

    "AxeTexture": "0",
    "AxeVPImage": "0",

    "WoodenAxeTexture": "0",
    "WoodenAxeVPImage": "0",

    "ShearsMesh": "0",
    "ShearsTexture": "0",
    "ShearsVPImage": "0",

    "ShearsRotation": [
        0,
        0,
        -35
    ],

    "SpeedPotionMesh": "0",
    "SpeedPotionTexture": "0",
    "SpeedPotionVPImage": "0",

    "JumpPotionMesh": "0",
    "JumpPotionTexture": "0",
    "JumpPotionVPImage": "0",

    "FireballMesh": "0",
    "FireballTexture": "0",
    "FireballVPImage": "0",

    "ClayGreen": "0",
    "ClayBlue": "0",
    "ClayOrange": "0",
    "ClayGrey": "0",
    "ClayCyan": "0",
    "ClayYellow": "0",
    "ClayPurple": "0",
    "ClayRed": "0",

    "SkyBottom": "0",
    "SkyTop": "0",
    "SkyLeft": "0",
    "SkyBack": "0",
    "SkyRight": "0",
    "SkyFront": "0"

};


// ============================================================
// COMMAND
// ============================================================

module.exports = {

    data:
        new SlashCommandBuilder()
            .setName('portpack')
            .setDescription(
                'Convert a 1.8.9 texture pack (.zip) into a Bridge Duels JSON'
            )

            .addSubcommand(
                sub =>
                    sub
                        .setName('pack')
                        .setDescription(
                            'Upload a .zip resource pack'
                        )
                        .addAttachmentOption(
                            option =>
                                option
                                    .setName('file')
                                    .setDescription(
                                        'Resource Pack .zip'
                                    )
                                    .setRequired(true)
                        )
            )

            .addSubcommand(
                sub =>
                    sub
                        .setName('url')
                        .setDescription(
                            'Use a MediaFire link'
                        )
            ),

    async execute(interaction) {

        const subcommand =
            interaction.options.getSubcommand();

        if (
            subcommand === 'url'
        ) {

            const modal =
                new ModalBuilder()
                    .setCustomId(
                        'portpack_url_modal'
                    )
                    .setTitle(
                        'PortPack • MediaFire'
                    );

            const urlInput =
                new TextInputBuilder()
                    .setCustomId(
                        'portpack_url'
                    )
                    .setLabel(
                        'Enlace de MediaFire'
                    )
                    .setPlaceholder(
                        'https://www.mediafire.com/file/...'
                    )
                    .setStyle(
                        TextInputStyle.Short
                    )
                    .setRequired(true)
                    .setMaxLength(1000);

            modal.addComponents(
                new ActionRowBuilder()
                    .addComponents(
                        urlInput
                    )
            );

            await interaction.showModal(
                modal
            );

            return;
        }

        const attachment =
            interaction.options.getAttachment(
                'file'
            );

        if (
            !interaction.deferred &&
            !interaction.replied
        ) {

            await interaction.deferReply();
        }

        try {

            const selectedResources =
                await selectResources(
                    interaction
                );

            if (
                !selectedResources ||
                selectedResources.length === 0
            ) {

                throw new Error(
                    'You must select at least one resource'
                );
            }

            await processPack(
                interaction,
                attachment,
                selectedResources
            );

        } catch (error) {

            console.error(
                '[PORTPACK SELECT]',
                error
            );

            await safeEditReply(
                interaction,
                `❌ **Error:**\n\`${String(
                    error?.message ||
                    'Error desconocido.'
                ).slice(0, 1800)}\``
            );
        }
    },


    async handleUrlModal(interaction) {

        try {

            await interaction.deferReply();

            const url =
                interaction.fields
                    .getTextInputValue(
                        'portpack_url'
                    )
                    .trim();

            if (!url) {

                throw new Error(
                    'No link was provided'
                );
            }

            if (
                !/^https?:\/\/(www\.)?mediafire\.com\//i.test(
                    url
                )
            ) {

                throw new Error(
                    'The link has to be from MediaFire'
                );
            }

            const selectedResources =
                await selectResources(
                    interaction
                );

            if (
                !selectedResources ||
                selectedResources.length === 0
            ) {

                throw new Error(
                    'You must select at least one resource'
                );
            }

            await processPackFromUrl(
                interaction,
                url,
                selectedResources
            );

        } catch (error) {

            console.error(
                '[PORTPACK URL]',
                error
            );

            await safeEditReply(
                interaction,
                `❌ **Error:**\n\`${String(
                    error?.message ||
                    'Error desconocido.'
                ).slice(0, 1800)}\``
            );
        }
    }

};


// RESOURCE SELECTOR
// ============================================================

async function selectResources(
    interaction
) {

    const customPrefix =
        `portpack_resources_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 8)}`;

    const menuCustomIds = [
        `${customPrefix}_1`,
        `${customPrefix}_2`
    ];

    const continueCustomId =
        `${customPrefix}_continue`;

    const selectAllCustomIds = [
        `${customPrefix}_select_all_1`,
        `${customPrefix}_select_all_2`
    ];

    const chunks = [];

    for (
        let i = 0;
        i < RESOURCE_OPTIONS.length;
        i += 25
    ) {

        chunks.push(
            RESOURCE_OPTIONS.slice(
                i,
                i + 25
            )
        );
    }

    const selected =
        new Set();


    // ========================================================
    // RENDER SELECT MENUS
    // ========================================================
    // The important part here is that "Seleccionar todo" also
    // changes the actual selected state shown inside Discord's
    // select menu. This means the user can press "Seleccionar todo"
    // and then manually deselect one or more resources.

    const buildRows = () => {

        const rows =
            chunks.flatMap(
                (chunk, index) => {

                    const menu =
                        new StringSelectMenuBuilder()
                            .setCustomId(
                                menuCustomIds[index]
                            )
                            .setPlaceholder(
                                index === 0
                                    ? 'Select Items / resources'
                                    : 'Select Wool, Sky and Crosshair'
                            )
                            .setMinValues(0)
                            .setMaxValues(
                                chunk.length
                            )
                            .addOptions(
                                chunk.map(
                                    option => {

                                        const builderOption = {
                                            label:
                                                option.label
                                                    .slice(
                                                        0,
                                                        100
                                                    ),

                                            value:
                                                option.value,

                                            description:
                                                option.description
                                                    .slice(
                                                        0,
                                                        100
                                                    ),

                                            // This is what makes the
                                            // selection visible in the
                                            // actual Discord select menu.
                                            default:
                                                selected.has(
                                                    option.value
                                                )
                                        };

                                        if (
                                            option.emoji
                                        ) {

                                            builderOption.emoji =
                                                option.emoji;
                                        }

                                        return builderOption;
                                    }
                                )
                            );

                    const selectAllButton =
                        new ButtonBuilder()
                            .setCustomId(
                                selectAllCustomIds[index]
                            )
                            .setLabel(
                                `Select all ${index + 1}`
                            )
                            .setStyle(
                                ButtonStyle.Secondary
                            );

                    return [
                        new ActionRowBuilder()
                            .addComponents(
                                menu
                            ),
                        new ActionRowBuilder()
                            .addComponents(
                                selectAllButton
                            )
                    ];
                }
            );


        rows.push(
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(
                            continueCustomId
                        )
                        .setLabel(
                            'Continue'
                        )
                        .setStyle(
                            ButtonStyle.Success
                        ),

                    new ButtonBuilder()
                        .setCustomId(
                            `${customPrefix}_cancel`
                        )
                        .setLabel(
                            'Cancel'
                        )
                        .setStyle(
                            ButtonStyle.Danger
                        )
                )
        );


        return rows;
    };


    const renderSelector =
        async () => {

            await safeEditReply(
                interaction,
                {
                    content:
                        `## 📦 Select the resources twin\n\n` +
                        `Choose **one or several resources** that you want to convert\n\n` +
                        `Only the selected resources will be processed\n` +
                        `If you select **Sky**, you'll then be able to choose which sky to use\n\n` +
                        `When you are done, press **Continue**\n\n` +
                        `You have **5 minutes** to choose`,

                    components:
                        buildRows()
                }
            );
        };


    await renderSelector();


    const replyMessage =
        await interaction.fetchReply();


    return new Promise(
        async (resolve, reject) => {

            let finished = false;


            const finish =
                async callback => {

                    if (
                        finished
                    ) {
                        return;
                    }

                    finished = true;

                    try {

                        await callback();

                    } catch (error) {

                        console.error(
                            '[PORTPACK RESOURCES] Finish:',
                            error.message
                        );
                    }
                };


            const collector =
                replyMessage.createMessageComponentCollector({

                    time:
                        300000,

                    filter:
                        component =>
                            (
                                menuCustomIds.includes(
                                    component.customId
                                ) ||
                                selectAllCustomIds.includes(
                                    component.customId
                                ) ||
                                component.customId ===
                                    continueCustomId ||
                                component.customId ===
                                    `${customPrefix}_cancel`
                            ) &&
                            component.user.id ===
                                interaction.user.id

                });


            collector.on(
                'collect',
                async component => {

                    if (
                        selectAllCustomIds.includes(
                            component.customId
                        )
                    ) {

                        const menuIndex =
                            selectAllCustomIds.indexOf(
                                component.customId
                            );

                        const chunk =
                            chunks[menuIndex] || [];

                        for (const option of chunk) {
                            selected.add(option.value);
                        }

                        try {
                            await component.deferUpdate();
                        } catch (error) {
                            console.warn(
                                '[PORTPACK RESOURCES] select-all deferUpdate:',
                                error.message
                            );
                        }

                        // Re-render the menus so every selected option
                        // is visibly checked/selected in Discord.
                        await renderSelector();

                        return;
                    }

                    if (
                        menuCustomIds.includes(
                            component.customId
                        )
                    ) {

                        try {

                            await component.deferUpdate();

                        } catch (error) {

                            console.warn(
                                '[PORTPACK RESOURCES] deferUpdate:',
                                error.message
                            );
                        }


                        // Only replace the selections belonging to this
                        // menu. The other menu keeps its current state.
                        const menuIndex =
                            menuCustomIds.indexOf(
                                component.customId
                            );

                        const chunk =
                            chunks[
                                menuIndex
                            ] || [];


                        for (
                            const option of chunk
                        ) {

                            selected.delete(
                                option.value
                            );
                        }


                        for (
                            const value of (
                                component.values ||
                                []
                            )
                        ) {

                            selected.add(
                                value
                            );
                        }


                        // Re-render immediately so the menu reflects
                        // exactly what the user selected/deselected.
                        await renderSelector();

                        return;
                    }


                    if (
                        component.customId ===
                        `${customPrefix}_cancel`
                    ) {

                        await finish(
                            async () => {

                                collector.stop(
                                    'cancelled'
                                );

                                try {

                                    await component.deferUpdate();

                                } catch (error) {}

                                await safeEditReply(
                                    interaction,
                                    {
                                        content:
                                            `## ❌ PortPack canceled\n\n` +
                                            `No appeal was processed`,

                                        components: []
                                    }
                                );

                                reject(
                                    new Error(
                                        'Resource selection canceled'
                                    )
                                );
                            }
                        );

                        return;
                    }


                    if (
                        component.customId ===
                        continueCustomId
                    ) {

                        if (
                            selected.size === 0
                        ) {

                            try {

                                await component.reply({
                                    content:
                                        'Select at least one resource before continuing',
                                    ephemeral: true
                                });

                            } catch (error) {}

                            return;
                        }


                        await finish(
                            async () => {

                                collector.stop(
                                    'selected'
                                );

                                try {

                                    await component.deferUpdate();

                                } catch (error) {}


                                const selectedArray =
                                    Array.from(
                                        selected
                                    );


                                const selectedLabels =
                                    selectedArray
                                        .map(
                                            value =>
                                                getSelectedResourceLabel(
                                                    value
                                                )
                                        );


                                await safeEditReply(
                                    interaction,
                                    {
                                        content:
                                            `## Selected resources\n\n` +
                                            selectedLabels
                                                .map(
                                                    label =>
                                                        `• ${label}`
                                                )
                                                .join('\n') +
                                            `\n\nPreparing PortPack...`,

                                        components: []
                                    }
                                );


                                resolve(
                                    selectedArray
                                );
                            }
                        );
                    }
                }
            );


            collector.on(
                'end',
                async (
                    collected,
                    reason
                ) => {

                    if (
                        finished
                    ) {
                        return;
                    }


                    await finish(
                        async () => {

                            if (
                                reason ===
                                'selected'
                            ) {
                                return;
                            }


                            await safeEditReply(
                                interaction,
                                {
                                    content:
                                        `## Selection canceled\n\n` +
                                        `The selection wasnt finished within the time limit`,

                                    components: []
                                }
                            );


                            reject(
                                new Error(
                                    'Time ran out to select resources'
                                )
                            );
                        }
                    );
                }
            );
        }
    );
}


// ============================================================
// RESOURCE LABELS
// ============================================================

function getResourceLabel(
    fileName
) {

    const labels = {

        'apple_golden.png':
            'Golden Apple',

        'bow_pulling_0.png':
            'Bow Pulling 0',

        'bow_pulling_1.png':
            'Bow Pulling 1',

        'bow_pulling_2.png':
            'Bow Pulling 2',

        'bow_standby.png':
            'Bow Standby',

        'diamond.png':
            'Diamond',

        'diamond_sword.png':
            'Diamond Sword',

        'diamond_pickaxe.png':
            'Diamond Pickaxe',

        'diamond_axe.png':
            'Diamond Axe',

        'emerald.png':
            'Emerald',

        'ender_pearl.png':
            'Ender Pearl',

        'gold_sword.png':
            'Gold Sword',

        'gold_pickaxe.png':
            'Gold Pickaxe',

        'gold_axe.png':
            'Gold Axe',

        'iron_ingot.png':
            'Iron Ingot',

        'iron_sword.png':
            'Iron Sword',

        'iron_pickaxe.png':
            'Iron Pickaxe',

        'iron_axe.png':
            'Iron Axe',

        'wood_pickaxe.png':
            'Wood Pickaxe',

        'wood_sword.png':
            'Wood Sword',

        'wood_axe.png':
            'Wood Axe',

        'shears.png':
            'Shears',

        'potion_bottle_empty.png':
            'Potion Bottle',

        'fireball.png':
            'Fireball',

        'wool_colored_green.png':
            'Wool Green',

        'wool_colored_blue.png':
            'Wool Blue',

        'wool_colored_orange.png':
            'Wool Orange',

        'wool_colored_gray.png':
            'Wool Gray',

        'wool_colored_cyan.png':
            'Wool Cyan',

        'wool_colored_yellow.png':
            'Wool Yellow',

        'wool_colored_purple.png':
            'Wool Purple',

        'wool_colored_red.png':
            'Wool Red'

    };


    return labels[
        fileName
    ] ||
        fileName.replace(
            /\.png$/i,
            ''
        );
}


function getSelectedResourceLabel(
    value
) {

    if (
        value === 'sky'
    ) {

        return 'Sky';
    }

    if (
        value === 'crosshair'
    ) {

        return 'Crosshair';
    }

    const separator =
        value.indexOf(':');

    if (
        separator === -1
    ) {

        return value;
    }

    const type =
        value.slice(
            0,
            separator
        );

    const fileName =
        value.slice(
            separator + 1
        );


    if (
        type === 'wool'
    ) {

        return `${getResourceLabel(fileName)}`;
    }


    return `${getResourceLabel(fileName)}`;
}


// ============================================================
// ATTACHMENT
// ============================================================

async function processPack(
    interaction,
    attachment,
    selectedResources
) {

    if (!attachment) {

        throw new Error(
            'No Resource Pack was provided'
        );
    }

    const fileName =
        String(
            attachment.name || ''
        ).toLowerCase();

    if (
        !fileName.endsWith('.zip')
    ) {

        throw new Error(
            'The file must be a **.zip** Resource Pack lol'
        );
    }

    await processPackFromDownload(
        interaction,
        attachment.url,
        attachment.name || 'unnamepack.zip',
        selectedResources
    );
}


// ============================================================
// MEDIAFIRE
// ============================================================

async function processPackFromUrl(
    interaction,
    mediafireUrl,
    selectedResources
) {

    await updateProgress(
        interaction,
        1,
        'Analyzing MediaFire link...'
    );

    const directUrl =
        await resolveMediaFireUrl(
            mediafireUrl
        );

    console.log(
        `[PORTPACK] MediaFire direct URL: ${directUrl}`
    );

    await processPackFromDownload(
        interaction,
        directUrl,
        'mediafire_resourcepack.zip',
        selectedResources
    );
}


// ============================================================
// RESOLVE MEDIAFIRE
// ============================================================

async function resolveMediaFireUrl(
    url
) {

    if (
        /\.(zip)(\?|$)/i.test(url) ||
        /download\d*\.mediafire\.com/i.test(url)
    ) {

        return url;
    }

    const response =
        await axios.get(
            url,
            {
                timeout: 20000,
                maxRedirects: 10,
                responseType: 'text',
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154 Safari/537.36'
                }
            }
        );

    const html =
        String(
            response.data || ''
        );

    const patterns = [

        /download_link\s*=\s*["']([^"']+)["']/i,

        /"downloadUrl"\s*:\s*"([^"]+)"/i,

        /"download_link"\s*:\s*"([^"]+)"/i,

        /href=["'](https?:\/\/download[^"']+)["']/i,

        /href=["'](https?:\/\/[^"']*mediafire[^"']*download[^"']*)["']/i,

        /(https:\/\/download\d*\.mediafire\.com\/[^"'\\\s<>]+)/i

    ];

    for (
        const regex of patterns
    ) {

        const match =
            html.match(
                regex
            );

        if (
            match &&
            match[1]
        ) {

            return decodeHtmlEntities(
                match[1]
            )
                .replace(
                    /\\u0026/g,
                    '&'
                )
                .replace(
                    /\\\//g,
                    '/'
                );
        }
    }

    const generic =
        html.match(
            /https?:\\?\/\\?\/download\d*\.mediafire\.com\/[^"'\\\s<>]+/i
        );

    if (
        generic &&
        generic[0]
    ) {

        return decodeHtmlEntities(
            generic[0]
        )
            .replace(
                /\\\//g,
                '/'
            );
    }

    throw new Error(
        'I couldnt get the direct download link from MediaFire'
    );
}


// ============================================================
// MAIN PROCESS
// ============================================================

async function processPackFromDownload(
    interaction,
    downloadUrl,
    displayName,
    selectedResources
) {

    const selectedSet =
        new Set(
            selectedResources || []
        );


    const selectedItemImages =
        REQUIRED_IMAGES.filter(
            imageName =>
                selectedSet.has(
                    `item:${imageName}`
                )
        );


    const selectedWoolImages =
        WOOL_IMAGES.filter(
            woolName =>
                selectedSet.has(
                    `wool:${woolName}`
                )
        );


    const skySelected =
        selectedSet.has(
            'sky'
        );


    const crosshairSelected =
        selectedSet.has(
            'crosshair'
        );


    console.log(
        '[PORTPACK] Selected resources:',
        Array.from(
            selectedSet
        )
    );


    const tempRoot =
        path.join(
            __dirname,
            '..',
            'temp'
        );

    fs.mkdirSync(
        tempRoot,
        {
            recursive: true
        }
    );

    const jobId =
        `portpack_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 8)}`;

    const tempDir =
        path.join(
            tempRoot,
            jobId
        );

    fs.mkdirSync(
        tempDir,
        {
            recursive: true
        }
    );

    const zipPath =
        path.join(
            tempDir,
            'unnamepack.zip'
        );

    try {

        await updateProgress(
            interaction,
            3,
            `Downloading ${displayName}...`
        );

        const response =
            await retryOperation(
                async () => {

                    return axios.get(
                        downloadUrl,
                        {
                            responseType:
                                'arraybuffer',

                            timeout:
                                120000,

                            maxContentLength:
                                150 * 1024 * 1024,

                            maxBodyLength:
                                150 * 1024 * 1024,

                            headers: {
                                'User-Agent':
                                    'Mozilla/5.0'
                            }
                        }
                    );
                },
                'Resource Pack download'
            );

        fs.writeFileSync(
            zipPath,
            Buffer.from(
                response.data
            )
        );


        // ====================================================
        // ZIP
        // ====================================================

        await updateProgress(
            interaction,
            8,
            'Analyzing Resource Pack...'
        );

        const directory =
            await unzipper.Open.file(
                zipPath
            );

        // ====================================================
        // PACK HISTORY IMAGE
        // ====================================================
        // pack.png must be at the ZIP root, next to assets/.
        // It is used only for the #📋・pack-history forum post.
        const packImageEntry =
            directory.files.find(
                file =>
                    normalizeZipPath(file.path).toLowerCase() === 'pack.png'
            );

        const packImagePath =
            path.join(
                tempDir,
                'pack.png'
            );

        if (packImageEntry) {
            fs.writeFileSync(
                packImagePath,
                await packImageEntry.buffer()
            );

            console.log(
                '[PACK-HISTORY] pack.png found at ZIP root.'
            );
        } else {
            console.log(
                '[PACK-HISTORY] pack.png not found at ZIP root. History post will be skipped.'
            );
        }

        const filesByName =
            new Map();

        for (
            const file of directory.files
        ) {

            if (
                !file ||
                !file.path
            ) {
                continue;
            }

            const normalized =
                normalizeZipPath(
                    file.path
                );

            if (
                normalized.endsWith('/')
            ) {
                continue;
            }

            filesByName.set(
                normalized.toLowerCase(),
                file
            );
        }


        // ====================================================
        // SELECTED ITEMS
        // ====================================================

        const foundFiles = {};
        const missingImages = [];

        for (
            const imageName of selectedItemImages
        ) {

            const wantedPath =
                `${ITEMS_PATH}/${imageName}`
                    .toLowerCase();

            const file =
                filesByName.get(
                    wantedPath
                );

            if (!file) {

                missingImages.push(
                    imageName
                );

            } else {

                foundFiles[
                    imageName
                ] = file;
            }
        }


        if (
            missingImages.length
        ) {

            console.log(
                '[PORTPACK] Selected item files missing and skipped:',
                missingImages
            );
        }


        const availableItemImages =
            selectedItemImages.filter(
                imageName =>
                    Boolean(
                        foundFiles[
                            imageName
                        ]
                    )
            );


        // ====================================================
        // WOOL
        // ====================================================

        const foundWoolFiles = {};
        const missingWool = [];

        for (
            const woolName of selectedWoolImages
        ) {

            const wantedPath =
                `${WOOL_PATH}/${woolName}`
                    .toLowerCase();

            const file =
                filesByName.get(
                    wantedPath
                );

            if (file) {

                foundWoolFiles[
                    woolName
                ] = file;

            } else {

                missingWool.push(
                    woolName
                );
            }
        }


        if (
            missingWool.length
        ) {

            console.log(
                '[PORTPACK] Selected wool files missing and skipped:',
                missingWool
            );
        }


        const foundWoolNames =
            Object.keys(
                foundWoolFiles
            );


        // ====================================================
        // SKY
        // ====================================================

        const foundSkyFiles = {};

        if (
            skySelected
        ) {

            for (
                const skyName of SKY_SOURCES
            ) {

                const wantedPath =
                    `${SKY_PATH}/${skyName}`
                        .toLowerCase();

                const file =
                    filesByName.get(
                        wantedPath
                    );

                if (file) {

                    foundSkyFiles[
                        skyName
                    ] = file;
                }
            }
        }


        const foundSkyNames =
            Object.keys(
                foundSkyFiles
            );


        // ====================================================
        // CROSSHAIR
        // ====================================================

        let crosshairFile =
            null;

        if (
            crosshairSelected
        ) {

            crosshairFile =
                filesByName.get(
                    GUI_ICONS_PATH.toLowerCase()
                );
        }


        console.log(
            `[PORTPACK] Crosshair icons.png: ${
                crosshairFile
                    ? 'FOUND'
                    : crosshairSelected
                        ? 'NOT FOUND - WILL BE OMITTED'
                        : 'NOT SELECTED'
            }`
        );


        // ====================================================
        // SKY SELECT
        // ====================================================

        let selectedSkyName = null;

        if (
            skySelected &&
            foundSkyNames.length === 1
        ) {

            selectedSkyName =
                foundSkyNames[0];

            await updateProgress(
                interaction,
                9,
                `Sky automatically detected: ${selectedSkyName}`
            );

        } else if (
            skySelected &&
            foundSkyNames.length > 1
        ) {

            selectedSkyName =
                await selectSky(
                    interaction,
                    foundSkyNames,
                    tempDir,
                    foundSkyFiles
                );

            if (!selectedSkyName) {

                throw new Error(
                    'No sky was selected'
                );
            }

            await updateProgress(
                interaction,
                9,
                `Sky selected: ${selectedSkyName}`
            );

        } else if (
            skySelected
        ) {

            await updateProgress(
                interaction,
                9,
                'Sky selected but no compatible file was found. Continuing..'
            );
        }


        // ====================================================
        // EXTRACT ITEMS
        // ====================================================

        const imagesDir =
            path.join(
                tempDir,
                'images'
            );

        fs.mkdirSync(
            imagesDir,
            {
                recursive: true
            }
        );


        if (
            availableItemImages.length > 0
        ) {

            await updateProgress(
                interaction,
                10,
                `Extracting ${availableItemImages.length} selected textures..`
            );


            await Promise.all(
                availableItemImages.map(
                    async imageName => {

                        const buffer =
                            await foundFiles[
                                imageName
                            ].buffer();

                        fs.writeFileSync(
                            path.join(
                                imagesDir,
                                imageName
                            ),
                            buffer
                        );
                    }
                )
            );

        } else {

            await updateProgress(
                interaction,
                10,
                'There are no item textures available to process'
            );
        }


        // ====================================================
        // PREPARE WOOL FILES FOR RESOLUTION CHECK
        // ====================================================

        // Wool textures are stored in the ZIP as buffers. Write the
        // selected ones to temp first so the resolution checker can
        // inspect them before the normal Wool processing starts.
        // The processing stage below will reuse these files, including
        // any cropped version created by the resolution checker.
        for (const woolName of foundWoolNames) {

            const woolFile =
                foundWoolFiles[woolName];

            const woolInputPath =
                path.join(
                    tempDir,
                    `wool_${sanitizeFileName(woolName)}`
                );

            if (!fs.existsSync(woolInputPath)) {

                const buffer =
                    await woolFile.buffer();

                fs.writeFileSync(
                    woolInputPath,
                    buffer
                );
            }
        }


        // ====================================================
        // RESOLUTION CHECK / OPTIONAL CROPPING
        // ====================================================

        // Check every selected Item/Wool texture before starting any
        // Roblox upload or Blender work. If several textures are wrong
        // at the same time, they are all shown in ONE confirmation and
        // cropped together when the user accepts.
        const squareTextureCandidates = [];

        for (const imageName of availableItemImages) {

            squareTextureCandidates.push({
                imageName,
                imagePath: path.join(
                    imagesDir,
                    imageName
                ),
                type: 'item'
            });
        }

        for (const woolName of foundWoolNames) {

            squareTextureCandidates.push({
                imageName: woolName,
                imagePath: path.join(
                    tempDir,
                    `wool_${sanitizeFileName(
                        woolName
                    )}`
                ),
                type: 'wool'
            });
        }


        const invalidSquareTextures =
            await findInvalidSquareTextures(
                squareTextureCandidates
            );


        if (invalidSquareTextures.length > 0) {

            const shouldCrop =
                await confirmCropInvalidTextures(
                    interaction,
                    invalidSquareTextures
                );

            if (!shouldCrop) {

                throw new Error(
                    'The processing was canceled because there are textures with incompatible resolution.'
                );
            }


            await updateProgress(
                interaction,
                12,
                `Trimming ${invalidSquareTextures.length} texture(s) to their square resolution...`
            );


            await Promise.all(
                invalidSquareTextures.map(
                    texture =>
                        cropTextureToSquare(
                            texture.imagePath,
                            texture.targetSize
                        )
                )
            );

            console.log(
                '[PORTPACK] Invalid textures cropped:',
                invalidSquareTextures.map(
                    texture =>
                        `${texture.imageName}: ${texture.width}x${texture.height} -> ${texture.targetSize}x${texture.targetSize}`
                )
            );
        }


        // ====================================================
        // PREPARE
        // ====================================================

        const generatedAssets = {};

        const meshRequired =
            availableItemImages.filter(
                imageName =>
                    IMAGE_MAPPINGS[
                        imageName
                    ]?.mesh?.length > 0
            );


        let completed = 0;


        await updateProgress(
            interaction,
            15,
            availableItemImages.length > 0
                ? 'Processing textures, Roblox, and Blender in parallel..'
                : 'No items selected available. Continuing..'
        );


        // ====================================================
        // ITEMS
        // ====================================================

        if (
            availableItemImages.length > 0
        ) {

            await runWithConcurrency(
                availableItemImages,
                CONCURRENCY,
                async imageName => {

                    const imagePath =
                        path.join(
                            imagesDir,
                            imageName
                        );

                    const baseName =
                        path.basename(
                            imageName,
                            '.png'
                        );

                    const texturePath =
                        path.join(
                            tempDir,
                            `texture_${sanitizeFileName(
                                imageName
                            )}`
                        );

                    const mapping =
                        IMAGE_MAPPINGS[
                            imageName
                        ];

                    const needsMesh =
                        mapping?.mesh?.length > 0;


                    const metadataPromise =
                        sharp(
                            imagePath
                        ).metadata();

                    const texturePromise =
                        createTexture(
                            imagePath,
                            texturePath
                        );

                    const [
                        metadata
                    ] =
                        await Promise.all([
                            metadataPromise,
                            texturePromise
                        ]);


                    const width =
                        metadata.width;

                    const height =
                        metadata.height;


                    if (
                        !width ||
                        !height
                    ) {

                        throw new Error(
                            `Could not detect the resolution of ${imageName}.`
                        );
                    }


                    if (
                        width !== height
                    ) {

                        throw new Error(
                            `${imageName} its not square (${width}x${height}).`
                        );
                    }


                    if (
                        !VALID_SIZES.includes(
                            width
                        )
                    ) {

                        throw new Error(
                            `${imageName} it has resolution ${width}x${height}.\n` +
                            `Allowed: ${VALID_SIZES
                                .map(
                                    x => `${x}x${x}`
                                )
                                .join(', ')}`
                        );
                    }


                    const textureUploadPromise =
                        uploadAsset(
                            texturePath,
                            'Image',
                            `PortPack_${baseName}_Texture_${Date.now()}`
                        );


                    let blenderPromise = null;

                    let fbxPath = null;
                    let blendPath = null;


                    if (
                        needsMesh
                    ) {

                        fbxPath =
                            path.join(
                                tempDir,
                                `${baseName}.fbx`
                            );

                        blendPath =
                            path.join(
                                tempDir,
                                `${baseName}.blend`
                            );


                        blenderPromise =
                            generateMeshWithBlender(
                                texturePath,
                                imagePath,
                                fbxPath,
                                blendPath,
                                width,
                                ROTATION_X,
                                ROTATION_Y,
                                ROTATION_Z
                            );
                    }


                    const textureId =
                        await textureUploadPromise;


                    let modelId = null;


                    if (
                        needsMesh
                    ) {

                        await blenderPromise;


                        modelId =
                            await uploadAsset(
                                fbxPath,
                                'Model',
                                `PortPack_${baseName}_Mesh_${Date.now()}`
                            );
                    }


                    generatedAssets[
                        imageName
                    ] = {

                        textureId:
                            String(
                                textureId
                            ),

                        modelId:
                            modelId
                                ? String(
                                    modelId
                                )
                                : null
                    };


                    completed++;


                    const progress =
                        Math.min(
                            84,
                            15 +
                            Math.round(
                                completed /
                                availableItemImages.length *
                                69
                            )
                        );


                    await updateProgress(
                        interaction,
                        progress,
                        `Processed ${completed}/${availableItemImages.length} • ${imageName}`
                    );
                }
            );

        }


        // ====================================================
        // WOOL
        // ====================================================

        const woolAssets = {};


        if (
            foundWoolNames.length > 0
        ) {

            await updateProgress(
                interaction,
                85,
                `Processing ${foundWoolNames.length} selected Wool..`
            );


            let woolCompleted = 0;


            await runWithConcurrency(
                foundWoolNames,
                CONCURRENCY,
                async woolName => {

                    const woolFile =
                        foundWoolFiles[
                            woolName
                        ];

                    const buffer =
                        await woolFile.buffer();


                    const inputPath =
                        path.join(
                            tempDir,
                            `wool_${sanitizeFileName(
                                woolName
                            )}`
                        );


                    const outputPath =
                        path.join(
                            tempDir,
                            `wool_texture_${sanitizeFileName(
                                woolName
                            )}`
                        );


                    // The file may already have been prepared and
                    // cropped by the resolution check above. Do not
                    // overwrite it with the original ZIP buffer.
                    if (!fs.existsSync(inputPath)) {

                        fs.writeFileSync(
                            inputPath,
                            buffer
                        );
                    }


                    await createTexture(
                        inputPath,
                        outputPath
                    );


                    const field =
                        WOOL_MAPPINGS[
                            woolName
                        ];


                    const textureId =
                        await uploadAsset(
                            outputPath,
                            'Image',
                            `PortPack_${field}_${Date.now()}`
                        );


                    woolAssets[
                        woolName
                    ] = {

                        field,

                        textureId:
                            String(
                                textureId
                            )
                    };


                    woolCompleted++;


                    await updateProgress(
                        interaction,
                        85 +
                        Math.round(
                            woolCompleted /
                            foundWoolNames.length *
                            2
                        ),
                        `🧶 Wool ${woolCompleted}/${foundWoolNames.length} • ${woolName}`
                    );
                }
            );
        }


        // ====================================================
        // SKY
        // ====================================================

        const skyAssets = {};


        if (
            selectedSkyName
        ) {

            await updateProgress(
                interaction,
                88,
                `Processing Sky • ${selectedSkyName}...`
            );


            const skyBuffer =
                await foundSkyFiles[
                    selectedSkyName
                ].buffer();


            const skySourcePath =
                path.join(
                    tempDir,
                    `sky_source_${sanitizeFileName(
                        selectedSkyName
                    )}`
                );


            fs.writeFileSync(
                skySourcePath,
                skyBuffer
            );


            const skyMetadata =
                await sharp(
                    skySourcePath
                ).metadata();


            if (
                !skyMetadata.width ||
                !skyMetadata.height
            ) {

                throw new Error(
                    `Could not detect the sky resolution ${selectedSkyName}.`
                );
            }


            if (
                skyMetadata.width % 3 !== 0 ||
                skyMetadata.height % 2 !== 0
            ) {

                throw new Error(
                    `The sky ${selectedSkyName} it doesnt have a valid 3x2 layout\n` +
                    `Resolution found: ${skyMetadata.width}x${skyMetadata.height}`
                );
            }


            const faceWidth =
                Math.floor(
                    skyMetadata.width / 3
                );


            const faceHeight =
                Math.floor(
                    skyMetadata.height / 2
                );


            const skyFaces = [

                {
                    skyNumber: 1,
                    name: 'bottom',
                    left: 0,
                    top: 0
                },

                {
                    skyNumber: 2,
                    name: 'top',
                    left: 1,
                    top: 0
                },

                {
                    skyNumber: 3,
                    name: 'left',
                    left: 2,
                    top: 0
                },

                {
                    skyNumber: 4,
                    name: 'back',
                    left: 0,
                    top: 1
                },

                {
                    skyNumber: 5,
                    name: 'right',
                    left: 1,
                    top: 1
                },

                {
                    skyNumber: 6,
                    name: 'front',
                    left: 2,
                    top: 1
                }

            ];


            let skyCompleted = 0;


            await Promise.all(
                skyFaces.map(
                    async face => {

                        const facePath =
                            path.join(
                                tempDir,
                                `sky_${face.name}.png`
                            );


                        const field =
                            SKY_MAPPINGS[
                                face.name
                            ];


                        await sharp(
                            skySourcePath
                        )
                            .extract({
                                left:
                                    face.left *
                                    faceWidth,

                                top:
                                    face.top *
                                    faceHeight,

                                width:
                                    faceWidth,

                                height:
                                    faceHeight
                            })
                            .resize(
                                FINAL_SIZE,
                                FINAL_SIZE,
                                {
                                    fit:
                                        'fill',

                                    kernel:
                                        sharp.kernel.lanczos3,

                                    withoutEnlargement:
                                        false
                                }
                            )
                            .png({
                                compressionLevel:
                                    9,

                                adaptiveFiltering:
                                    true,

                                force:
                                    true
                            })
                            .toFile(
                                facePath
                            );


                        const textureId =
                            await uploadAsset(
                                facePath,
                                'Image',
                                `PortPack_${field}_${Date.now()}`
                            );


                        skyAssets[
                            field
                        ] =
                            String(
                                textureId
                            );


                        skyCompleted++;


                        await updateProgress(
                            interaction,
                            88 +
                            Math.round(
                                skyCompleted /
                                skyFaces.length *
                                5
                            ),
                            `Sky ${skyCompleted}/6 • ${field}`
                        );
                    }
                )
            );
        }


        // ====================================================
        // CROSSHAIR
        // ====================================================

        let crosshairTextureId = null;


        if (
            crosshairSelected &&
            crosshairFile
        ) {

            await updateProgress(
                interaction,
                93,
                'Detecting Crosshair in gui/icons.png...'
            );


            const iconsBuffer =
                await crosshairFile.buffer();


            const iconsPath =
                path.join(
                    tempDir,
                    'icons.png'
                );


            const crosshairPath =
                path.join(
                    tempDir,
                    'crosshair.png'
                );


            fs.writeFileSync(
                iconsPath,
                iconsBuffer
            );


            const iconsMetadata =
                await sharp(
                    iconsPath
                ).metadata();


            if (
                !iconsMetadata.width ||
                !iconsMetadata.height
            ) {

                throw new Error(
                    'Could not read the resolution of gui/icons.png.'
                );
            }


            const crosshairCrop =
                detectCrosshairCrop(
                    iconsMetadata.width,
                    iconsMetadata.height
                );


            console.log(
                '[CROSSHAIR] icons.png:',
                `${iconsMetadata.width}x${iconsMetadata.height}`
            );


            console.log(
                '[CROSSHAIR] Crop:',
                crosshairCrop
            );


            await sharp(
                iconsPath
            )
                .extract(
                    crosshairCrop
                )
                .resize(
                    FINAL_SIZE,
                    FINAL_SIZE,
                    {
                        kernel:
                            sharp.kernel.nearest
                    }
                )
                .png()
                .toFile(
                    crosshairPath
                );


            crosshairTextureId =
                await uploadAsset(
                    crosshairPath,
                    'Image',
                    `PortPack_Crosshair_${Date.now()}`
                );


            crosshairTextureId =
                String(
                    crosshairTextureId
                );


            console.log(
                `[CROSSHAIR] TextureId: ${crosshairTextureId}`
            );

        } else if (
            crosshairSelected
        ) {

            await updateProgress(
                interaction,
                93,
                'Selected crosshair but gui/icons.png does not exist. Continuing..'
            );
        }


        // ====================================================
        // VALIDATE
        // ====================================================

        if (
            Object.keys(
                generatedAssets
            ).length !==
            availableItemImages.length
        ) {

            throw new Error(
                `Only processed ${Object.keys(
                    generatedAssets
                ).length}/${availableItemImages.length} selected textures available`
            );
        }


        // ====================================================
        // LUAU
        // ====================================================

        const modelEntries =
            meshRequired
                .filter(
                    imageName =>
                        generatedAssets[
                            imageName
                        ]?.modelId
                )
                .map(
                    imageName => ({
                        imageName,

                        modelId:
                            generatedAssets[
                                imageName
                            ].modelId
                    })
                );


        let meshIds = {};


        if (
            modelEntries.length > 0
        ) {

            await updateProgress(
                interaction,
                94,
                `Extracting ${modelEntries.length} MeshI in a single Roblox task`
            );


            meshIds =
                await extractAllMeshIdsWithLuau(
                    modelEntries
                );


            for (
                const entry of modelEntries
            ) {

                const meshId =
                    meshIds[
                        entry.imageName
                    ];


                if (!meshId) {

                    throw new Error(
                        `Luau didnt return MeshId for ${entry.imageName}.`
                    );
                }


                generatedAssets[
                    entry.imageName
                ].meshId =
                    String(
                        meshId
                    );
            }

        } else {

            await updateProgress(
                interaction,
                94,
                'There are no selected Meshes that need Luau extraction'
            );
        }


        // ====================================================
        // MAIN JSON
        // ====================================================

        await updateProgress(
            interaction,
            96,
            'Building Bridge Duels JSON'
        );


        const finalPack =
            buildFinalPack(
                generatedAssets,
                woolAssets,
                selectedResources
            );


        const jsonString =
            JSON.stringify(
                finalPack,
                null,
                4
            );


        // ====================================================
        // MAIN ZSTD
        // ====================================================

        await updateProgress(
            interaction,
            98,
            'Compressing main JSON'
        );


        const compressedBuffer =
    await zstdCompressAsync(
        Buffer.from(
            jsonString,
            'utf8'
        ),
        {
            params: {
                [zlib.constants.ZSTD_c_compressionLevel]: 10
            }
        }
    );


        const zbase64 =
            compressedBuffer.toString(
                'base64'
            );


        const compressedJson =
            JSON.stringify({
                m: null,
                t: 'buffer',
                zbase64
            });


        // ====================================================
        // SKY JSON NORMAL — UNCOMPRESSED
        // ====================================================

        let skyJsonString = null;


        if (
            selectedSkyName &&
            Object.keys(
                skyAssets
            ).length === 6
        ) {

            const skyPack = {

                "SkyBack":
                    String(
                        skyAssets.SkyBack
                    ),

                "SkyRight":
                    String(
                        skyAssets.SkyRight
                    ),

                "SkyLeft":
                    String(
                        skyAssets.SkyLeft
                    ),

                "SkyBottom":
                    String(
                        skyAssets.SkyBottom
                    ),

                "SkyTop":
                    String(
                        skyAssets.SkyTop
                    ),

                "SkyFront":
                    String(
                        skyAssets.SkyFront
                    )

            };


            skyJsonString =
                JSON.stringify(
                    skyPack,
                    null,
                    4
                );


            console.log(
                '[PORTPACK] Sky JSON WITHOUT compression generated'
            );


            console.log(
                '[PORTPACK] Sky mapping final:',
                skyPack
            );
        }


        // ====================================================
        // DONE
        // ====================================================

        await updateProgress(
            interaction,
            100,
            'Port pack finished'
        );


        await sendPortPackResult(
            interaction,
            displayName,
            compressedJson,
            skyJsonString,
            selectedSkyName,
            crosshairTextureId,
            tempDir,
            packImagePath
        );


        console.log(
            '[PORTPACK] Completed successfully'
        );


    } catch (error) {

        console.error(
            '[ERROR] /portpack:',
            error
        );


        await safeEditReply(
            interaction,
            `**Error in /portpack:**\n\n\`${String(
                error?.message ||
                'An unknown error occurred'
            ).slice(0, 1800)}\``
        );

    } finally {

        try {

            if (
                fs.existsSync(
                    tempDir
                )
            ) {

                fs.rmSync(
                    tempDir,
                    {
                        recursive: true,
                        force: true
                    }
                );
            }

        } catch (error) {

            console.warn(
                '[CLEANUP] Error:',
                error.message
            );
        }
    }
}


// ============================================================
// CROSSHAIR DETECTION
// ============================================================

function detectCrosshairCrop(
    width,
    height
) {

    if (
        width >= 16 &&
        height >= 16
    ) {

        const scale =
            width / 256;

        const cellSize =
            Math.max(
                1,
                Math.round(
                    16 * scale
                )
            );

        return {

            left: 0,
            top: 0,

            width:
                Math.min(
                    cellSize,
                    width
                ),

            height:
                Math.min(
                    cellSize,
                    height
                )
        };
    }


    return {

        left: 0,
        top: 0,

        width,
        height
    };
}


// ============================================================
// SKY SELECTOR
// ============================================================

async function selectSky(
    interaction,
    skyNames,
    tempDir,
    foundSkyFiles
) {

    if (
        !Array.isArray(skyNames) ||
        skyNames.length === 0
    ) {

        return null;
    }


    if (
        skyNames.length === 1
    ) {

        return skyNames[0];
    }


    const options =
        skyNames
            .slice(
                0,
                25
            )
            .map(
                (name, index) => ({

                    label:
                        name
                            .replace(
                                '.png',
                                ''
                            )
                            .slice(
                                0,
                                100
                            ),

                    value:
                        name,

                    description:
                        `Sky ${index + 1} • 3x2 layout`

                })
            );


    // ========================================================
    // SKY PREVIEWS
    // ========================================================

    const previewFiles = [];
    const previewEmbeds = [];

    const previewNames =
        skyNames.slice(0, 10);

    for (
        const name of previewNames
    ) {

        try {

            const sourceFile =
                foundSkyFiles?.[name];

            if (!sourceFile) {
                continue;
            }

            const previewName =
                `sky_preview_${sanitizeFileName(name)}`;

            const previewPath =
                path.join(
                    tempDir,
                    previewName
                );

            const buffer =
                await sourceFile.buffer();

            await sharp(buffer)
                .resize(1200, 800, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .png()
                .toFile(previewPath);

            previewFiles.push(
                new AttachmentBuilder(
                    previewPath,
                    {
                        name: previewName
                    }
                )
            );

            previewEmbeds.push(
                new EmbedBuilder()
                    .setTitle(`🌌 ${name}`)
                    .setImage(`attachment://${previewName}`)
            );

        } catch (error) {

            console.warn(
                `[PORTPACK SKY] Could not create preview for ${name}:`,
                error.message
            );
        }
    }


    const customId =
        `portpack_sky_select_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 8)}`;


    const menu =
        new StringSelectMenuBuilder()
            .setCustomId(
                customId
            )
            .setPlaceholder(
                'Select the Sky you want to use'
            )
            .addOptions(
                options
            );


    const row =
        new ActionRowBuilder()
            .addComponents(
                menu
            );


    await safeEditReply(
        interaction,
        {
            content:
                `## Select a Sky\n\n` +
                `Found **${skyNames.length}** sky(s) in:\n` +
                `\`${SKY_PATH}/\`\n\n` +
                `Preview images are shown below. Select one from the menu.\n` +
                `The selected Sky will automatically be split into **6 faces**, and each face will be converted to **1024×1024**.\n\n` +
                `You have **5 minutes** to select it.`,

            components: [
                row
            ],

            files: previewFiles,
            embeds: previewEmbeds
        }
    );


    const replyMessage =
        await interaction.fetchReply();


    return new Promise(
        async (resolve, reject) => {

            let finished = false;


            const finish =
                async callback => {

                    if (
                        finished
                    ) {
                        return;
                    }


                    finished = true;


                    try {

                        await callback();

                    } catch (error) {

                        console.error(
                            '[PORTPACK SKY] Error ending selector:',
                            error.message
                        );
                    }
                };


            const collector =
                replyMessage.createMessageComponentCollector({

                    componentType: 3,

                    time: 300000,

                    filter:
                        component =>
                            component.customId ===
                                customId &&
                            component.user.id ===
                                interaction.user.id

                });


            collector.on(
                'collect',
                async component => {

                    const selected =
                        component.values?.[0];


                    if (
                        !selected
                    ) {

                        return;
                    }


                    await finish(
                        async () => {

                            collector.stop(
                                'selected'
                            );


                            try {

                                await component.deferUpdate();

                            } catch (error) {

                                console.warn(
                                    '[PORTPACK SKY] deferUpdate:',
                                    error.message
                                );
                            }


                            await safeEditReply(
                                interaction,
                                {
                                    content:
                                        `## Sky selected\n\n` +
                                        `**${selected}**\n\n` +
                                        `Continuing with PortPack...`,

                                    components: [],
                                    embeds: [],
                                    attachments: []
                                }
                            );


                            resolve(
                                selected
                            );
                        }
                    );
                }
            );


            collector.on(
                'end',
                async (
                    collected,
                    reason
                ) => {

                    if (
                        finished
                    ) {
                        return;
                    }


                    if (
                        reason ===
                        'selected'
                    ) {
                        return;
                    }


                    await finish(
                        async () => {

                            await safeEditReply(
                                interaction,
                                {
                                    content:
                                        `## Sky selection cancelled\n\n` +
                                        `No Sky was selected within the time limit`,

                                    components: [],
                                    embeds: [],
                                    attachments: []
                                }
                            );


                            reject(
                                new Error(
                                    'The Sky selection timed out.'
                                )
                            );
                        }
                    );
                }
            );
        }
    );
}



// ============================================================
// RESOLUTION / CROPPING HELPERS
// ============================================================

function getCropTargetSize(
    width,
    height
) {

    const smallestSide =
        Math.min(
            Number(width),
            Number(height)
        );


    // Pick the largest valid Minecraft texture size that fits inside
    // the image. For the common cases from Resource Packs this gives:
    // 16x64 -> 16x16 and 32x128 -> 32x32.
    const possibleSizes =
        VALID_SIZES.filter(
            size =>
                size <= smallestSide
        );


    if (
        possibleSizes.length === 0
    ) {

        return null;
    }


    return Math.max(
        ...possibleSizes
    );
}


async function findInvalidSquareTextures(
    textures
) {

    const invalid = [];

    await Promise.all(
        textures.map(
            async texture => {

                const metadata =
                    await sharp(
                        texture.imagePath
                    ).metadata();

                const width =
                    metadata.width;

                const height =
                    metadata.height;

                if (
                    !width ||
                    !height
                ) {

                    throw new Error(
                        `Could not detect the resolution of ${texture.imageName}.`
                    );
                }


                const validSquare =
                    width === height &&
                    VALID_SIZES.includes(
                        width
                    );

                if (
                    validSquare
                ) {

                    return;
                }


                const targetSize =
                    getCropTargetSize(
                        width,
                        height
                    );


                if (
                    !targetSize
                ) {

                    throw new Error(
                        `${texture.imageName} it has resolution ${width}x${height} and there isnt an allowed resolution (${VALID_SIZES.map(size => `${size}x${size}`).join(', ')}) that can be obtained through trimming`
                    );
                }


                invalid.push({
                    ...texture,
                    width,
                    height,
                    targetSize
                });
            }
        )
    );


    return invalid;
}


async function cropTextureToSquare(
    imagePath,
    targetSize
) {

    const tempPath =
        `${imagePath}.cropping.tmp.png`;


    await sharp(
        imagePath
    )
        .extract({
            left: 0,
            top: 0,
            width: targetSize,
            height: targetSize
        })
        .png()
        .toFile(
            tempPath
        );


    fs.renameSync(
        tempPath,
        imagePath
    );
}


async function confirmCropInvalidTextures(
    interaction,
    invalidTextures
) {

    const customPrefix =
        `portpack_crop_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 8)}`;

    const yesId =
        `${customPrefix}_yes`;

    const noId =
        `${customPrefix}_no`;


    const lines =
        invalidTextures.map(
            texture =>
                `• **${texture.imageName}** — ${texture.width}x${texture.height} → **${texture.targetSize}x${texture.targetSize}**`
        );


    const content =
        `## Incompatible resolution\n\n` +
        `Found **${invalidTextures.length}** texture(s) that dont have an allowed square resolution\n\n` +
        lines.join('\n') +
        `\n\n✂️ If you choose **Cut**, PortPack will crop all those textures to the first valid resolution it can get and then continue normally with **texture upload, Solidify/Blender, MeshId, etc.**\n\n` +
        `Do you want to trim them automatically?`;


    await safeEditReply(
        interaction,
        {
            content:
                content.slice(
                    0,
                    1900
                ),

            components: [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(
                                yesId
                            )
                            .setLabel(
                                'Yes, cut and continue'
                            )
                            .setStyle(
                                ButtonStyle.Success
                            ),

                        new ButtonBuilder()
                            .setCustomId(
                                noId
                            )
                            .setLabel(
                                'No, cancel'
                            )
                            .setStyle(
                                ButtonStyle.Danger
                            )
                    )
            ]
        }
    );


    const replyMessage =
        await interaction.fetchReply();


    return new Promise(
        (resolve, reject) => {

            let done = false;

            const collector =
                replyMessage.createMessageComponentCollector({
                    time: 120000,
                    filter:
                        component =>
                            (
                                component.customId === yesId ||
                                component.customId === noId
                            ) &&
                            component.user.id ===
                                interaction.user.id
                });


            collector.on(
                'collect',
                async component => {

                    if (done) {
                        return;
                    }

                    done = true;
                    collector.stop(
                        component.customId === yesId
                            ? 'yes'
                            : 'no'
                    );


                    try {
                        await component.deferUpdate();
                    } catch (error) {}


                    if (
                        component.customId === yesId
                    ) {

                        await safeEditReply(
                            interaction,
                            {
                                content:
                                    `## Cutting textures...\n\n` +
                                    `**${invalidTextures.length}** texture(s) will be cut, and then PortPack will continue with the normal processing.`,
                                components: []
                            }
                        );

                        resolve(true);
                        return;
                    }


                    await safeEditReply(
                        interaction,
                        {
                            content:
                                `## PortPack canceled\n\n` +
                                `The textures with incompatible resolution weren't cropped.`,
                            components: []
                        }
                    );

                    resolve(false);
                }
            );


            collector.on(
                'end',
                async (collected, reason) => {

                    if (done) {
                        return;
                    }

                    done = true;

                    if (reason === 'yes') {
                        resolve(true);
                        return;
                    }


                    await safeEditReply(
                        interaction,
                        {
                            content:
                                `## ❌ Selection canceled\n\n` +
                                `The trimming question wasnt answered within the time limit.`,
                            components: []
                        }
                    );

                    resolve(false);
                }
            );
        }
    );
}


// ============================================================
// TEXTURE
// ============================================================

async function createTexture(
    inputPath,
    outputPath
) {

    await sharp(
        inputPath
    )
        .ensureAlpha()
        .resize(
            FINAL_SIZE,
            FINAL_SIZE,
            {
                kernel:
                    sharp.kernel.nearest
            }
        )
        .png()
        .toFile(
            outputPath
        );
}


// ============================================================
// BUILD JSON
// ============================================================

function buildFinalPack(
    generatedAssets,
    woolAssets,
    selectedResources
) {

    const result =
        JSON.parse(
            JSON.stringify(
                BASE_PACK
            )
        );


    const selectedSet =
        new Set(
            selectedResources || []
        );


    // ========================================================
    // ITEMS
    // ========================================================

    for (
        const imageName of REQUIRED_IMAGES
    ) {

        if (
            !selectedSet.has(
                `item:${imageName}`
            )
        ) {

            continue;
        }


        const mapping =
            IMAGE_MAPPINGS[
                imageName
            ];

        const generated =
            generatedAssets[
                imageName
            ];


        if (
            !mapping ||
            !generated
        ) {

            continue;
        }


        for (
            const field of mapping.mesh
        ) {

            if (
                generated.meshId
            ) {

                result[field] =
                    String(
                        generated.meshId
                    );
            }
        }


        for (
            const field of mapping.texture
        ) {

            if (
                generated.textureId
            ) {

                result[field] =
                    String(
                        generated.textureId
                    );
            }
        }
    }


    // ========================================================
    // WOOL
    // ========================================================

    for (
        const woolName of Object.keys(
            woolAssets
        )
    ) {

        if (
            !selectedSet.has(
                `wool:${woolName}`
            )
        ) {

            continue;
        }


        const wool =
            woolAssets[
                woolName
            ];


        if (
            wool?.field &&
            wool?.textureId
        ) {

            result[
                wool.field
            ] =
                String(
                    wool.textureId
                );
        }
    }


    return result;
}


// ============================================================
// SEND EVERYTHING IN ONE MESSAGE
// ============================================================

async function sendPortPackResult(
    interaction,
    displayName,
    compressedJson,
    skyJsonString,
    selectedSkyName,
    crosshairTextureId,
    tempDir,
    packImagePath
) {

    const safeName =
        String(
            displayName ||
            'resourcepack.zip'
        );


    // ========================================================
    // CONTENT
    // ========================================================

    let content =
        `# 📦 ${safeName}\n\n`;


    // ========================================================
    // MAIN JSON
    // ========================================================

    content +=
        `## Compressed JSON:\n\n`;


    const mainBlock =
        '```json\n' +
        compressedJson +
        '\n```\n\n';


    // ========================================================
    // SKY JSON
    // ========================================================

    if (
        skyJsonString &&
        selectedSkyName
    ) {

        content +=
            mainBlock;


        content +=
            `## Sky JSON\n\n` +
            `**Sky selected:** \`${selectedSkyName}\`\n\n` +
            `Sky1 → SkyBottom\n` +
            `Sky2 → SkyTop\n` +
            `Sky3 → SkyLeft\n` +
            `Sky4 → SkyBack\n` +
            `Sky5 → SkyRight\n` +
            `Sky6 → SkyFront\n\n` +
            '```json\n' +
            skyJsonString +
            '\n```\n\n';

    } else {

        content +=
            mainBlock;
    }


    // ========================================================
    // CROSSHAIR
    // ========================================================

    if (
        crosshairTextureId
    ) {

        content +=
            `## Crosshair\n\n` +
            `\`Crosshair → ${crosshairTextureId}\`\n`;

    } else {

        content +=
            `## Crosshair\n\n` +
            `Crosshair was not processed\n`;
    }


    // ========================================================
    // ONE MESSAGE
    // ========================================================

    if (
        content.length <= 2000
    ) {

        await safeEditReply(
            interaction,
            content
        );

        await postPackHistory(
            interaction,
            safeName,
            content,
            [],
            packImagePath
        );

        return;
    }


    // ========================================================
    // SINGLE MESSAGE WITH FILES
    // ========================================================

    const attachments = [];


    const mainJsonPath =
        path.join(
            tempDir,
            'bridge_duels.json'
        );


    fs.writeFileSync(
        mainJsonPath,
        compressedJson,
        'utf8'
    );


    attachments.push(
        new AttachmentBuilder(
            mainJsonPath,
            {
                name:
                    'bridge_duels.json'
            }
        )
    );


    if (
        skyJsonString &&
        selectedSkyName
    ) {

        const skyJsonPath =
            path.join(
                tempDir,
                'sky.json'
            );


        fs.writeFileSync(
            skyJsonPath,
            skyJsonString,
            'utf8'
        );


        attachments.push(
            new AttachmentBuilder(
                skyJsonPath,
                {
                    name:
                        'sky.json'
                }
            )
        );
    }


    // ========================================================
    // SHORT CONTENT
    // ========================================================

    let shortContent =
        `# 📦 ${safeName}\n\n` +
        `## JSON\n` +
        `📎 \`bridge_duels.json\`\n\n`;


    if (
        skyJsonString &&
        selectedSkyName
    ) {

        shortContent +=
            `## Sky JSON — Uncompressed\n` +
            ` \`sky.json\`\n\n` +
            `Sky1 → SkyBottom\n` +
            `Sky2 → SkyTop\n` +
            `Sky3 → SkyLeft\n` +
            `Sky4 → SkyBack\n` +
            `Sky5 → SkyRight\n` +
            `Sky6 → SkyFront\n\n`;
    }


    if (
        crosshairTextureId
    ) {

        shortContent +=
            `## Crosshair\n` +
            `Crosshair → \`${crosshairTextureId}\`\n\n`;

    } else {

        shortContent +=
            `## Crosshair\n` +
            `Unprocessed\n`;
    }


    await safeEditReply(
        interaction,
        {
            content:
                shortContent,

            files:
                attachments,

            components: []
        }
    );

    await postPackHistory(
        interaction,
        safeName,
        shortContent,
        attachments,
        packImagePath
    );
}


// ============================================================
// PACK HISTORY FORUM
// ============================================================

async function postPackHistory(
    interaction,
    packName,
    messageContent,
    resultAttachments,
    packImagePath
) {

    if (!packImagePath || !fs.existsSync(packImagePath)) {
        return;
    }

    try {
        const historyChannel =
            interaction.guild?.channels?.cache?.find(
                channel =>
                    channel.name === '📋・pack-history' &&
                    channel.type === ChannelType.GuildForum
            );

        if (!historyChannel) {
            console.warn(
                '[PACK-HISTORY] Forum channel #📋・pack-history was not found.'
            );
            return;
        }

        const historyFiles = [];

        // Re-create the result attachments from their local paths so the
        // forum post gets the same JSON/Sky files as the user's result.
        for (const attachment of resultAttachments || []) {
            const attachmentPath =
                attachment?.attachment;

            if (typeof attachmentPath === 'string' && fs.existsSync(attachmentPath)) {
                historyFiles.push(
                    new AttachmentBuilder(
                        attachmentPath,
                        {
                            name: attachment.name
                        }
                    )
                );
            }
        }

        const historyPackImage =
            new AttachmentBuilder(
                packImagePath,
                {
                    name: 'pack.png'
                }
            );

        historyFiles.push(historyPackImage);

        const historyEmbed =
            new EmbedBuilder()
                .setTitle(`📦 ${packName}`)
                .setDescription(
                    'PortPack result posted automatically.'
                )
                .setImage('attachment://pack.png')
                .setTimestamp();

        await historyChannel.threads.create({
            name: (String(packName).toLowerCase().endsWith('.zip')
                ? String(packName)
                : `${String(packName)}.zip`)
                .slice(0, 100),

            message: {
                content: messageContent,
                embeds: [historyEmbed],
                files: historyFiles
            }
        });

        console.log(
            `[PACK-HISTORY] History post created: ${packName}`
        );

    } catch (historyError) {
        console.error(
            '[PACK-HISTORY] Could not create history post:',
            historyError
        );
    }
}


// ============================================================
// BLENDER
// ============================================================

async function generateMeshWithBlender(
    texturePath,
    originalImagePath,
    fbxPath,
    blendPath,
    originalSize,
    rotationX,
    rotationY,
    rotationZ
) {

    const scriptPath =
        path.join(
            __dirname,
            '..',
            'create_image_mesh.py'
        );


    if (
        !fs.existsSync(
            scriptPath
        )
    ) {

        throw new Error(
            `create_image_mesh.py does not exist:\n${scriptPath}`
        );
    }


    if (
        !fs.existsSync(
            BLENDER_PATH
        )
    ) {

        throw new Error(
            `Blender was not found in:\n${BLENDER_PATH}`
        );
    }


    console.log(
        `[BLENDER] Rotation → X:${rotationX} Y:${rotationY} Z:${rotationZ}`
    );


    const command =
        `"${BLENDER_PATH}" ` +
        `--factory-startup ` +
        `--background ` +
        `--python "${scriptPath}" ` +
        `-- ` +
        `"${texturePath}" ` +
        `"${originalImagePath}" ` +
        `"${fbxPath}" ` +
        `"${blendPath}" ` +
        `${originalSize} ` +
        `${rotationX} ` +
        `${rotationY} ` +
        `${rotationZ}`;


    try {

        const result =
            await execPromise(
                command,
                {
                    timeout:
                        BLENDER_TIMEOUT,

                    maxBuffer:
                        30 * 1024 * 1024
                }
            );


        const output =
            `${result.stdout || ''}\n${result.stderr || ''}`;


        if (
            /Traceback \(most recent call last\):/i.test(
                output
            )
        ) {

            throw new Error(
                `Blender produced an error:\n${output.slice(-5000)}`
            );
        }

    } catch (error) {

        console.error(
            '[BLENDER]',
            error.stdout || ''
        );


        console.error(
            '[BLENDER STDERR]',
            error.stderr || ''
        );


        throw new Error(
            `Blender crashed:\n${error.message}`
        );
    }


    if (
        !fs.existsSync(
            fbxPath
        )
    ) {

        throw new Error(
            `Blender finished but didnt create the FBX:\n${fbxPath}`
        );
    }


    const stats =
        fs.statSync(
            fbxPath
        );


    if (
        stats.size <= 0
    ) {

        throw new Error(
            'The FBX was created but its empty'
        );
    }
}


// ============================================================
// ROBLOX UPLOAD
// ============================================================

async function uploadAsset(
    filePath,
    assetType,
    name
) {

    const apiKey =
        process.env.ROBLOX_API_KEY;

    const creatorId =
        process.env.ROBLOX_CREATOR_ID;

    const isGroup =
        String(
            process.env.ROBLOX_IS_GROUP
        ).toLowerCase() === 'true';


    if (
        !apiKey ||
        !creatorId
    ) {

        throw new Error(
            'ROBLOX_API_KEY or ROBLOX_CREATOR_ID are missing in .env'
        );
    }


    const result =
        await retryOperation(
            async () => {

                const form =
                    new FormData();


                const creator =
                    isGroup
                        ? {
                            groupId:
                                String(
                                    creatorId
                                )
                        }
                        : {
                            userId:
                                String(
                                    creatorId
                                )
                        };


                form.append(
                    'request',
                    JSON.stringify({
                        assetType,

                        displayName:
                            name,

                        description:
                            'Automatically generated by RobloxImageBot',

                        creationContext: {
                            creator
                        }
                    })
                );


                form.append(
                    'fileContent',
                    fs.createReadStream(
                        filePath
                    ),
                    {
                        filename:
                            path.basename(
                                filePath
                            ),

                        contentType:
                            assetType === 'Model'
                                ? 'model/fbx'
                                : 'image/png'
                    }
                );


                return axios.post(
                    'https://apis.roblox.com/assets/v1/assets',
                    form,
                    {
                        headers: {
                            ...form.getHeaders(),

                            'x-api-key':
                                apiKey
                        },

                        maxContentLength:
                            Infinity,

                        maxBodyLength:
                            Infinity,

                        timeout:
                            45000
                    }
                );
            },

            `uploaded ${assetType} ${name}`
        );


    const operationPath =
        result.data?.path;


    if (!operationPath) {

        throw new Error(
            `Roblox didnt return operation path:\n${JSON.stringify(
                result.data
            )}`
        );
    }


    const operationId =
        operationPath
            .split('/')
            .pop();


    for (
        let i = 0;
        i < ASSET_POLL_ATTEMPTS;
        i++
    ) {

        await sleep(
            ASSET_POLL_INTERVAL
        );


        const statusRes =
            await retryOperation(
                () =>
                    axios.get(
                        `https://apis.roblox.com/assets/v1/operations/${operationId}`,
                        {
                            headers: {
                                'x-api-key':
                                    apiKey
                            },

                            timeout:
                                8000
                        }
                    ),

                `operation inquiry ${operationId}`,

                1
            );


        const data =
            statusRes.data;


        if (
            data.done === true
        ) {

            if (
                data.error
            ) {

                throw new Error(
                    data.error.message ||
                    JSON.stringify(
                        data.error
                    )
                );
            }


            const assetId =
                data.response?.assetId;


            if (!assetId) {

                throw new Error(
                    `Roblox finished the operation but didnt return the assetID:\n${JSON.stringify(
                        data
                    )}`
                );
            }


            applyOpenUse(
                assetId,
                apiKey
            ).catch(
                error =>
                    console.warn(
                        `[ROBLOX] Open Use ${assetId}:`,
                        error.message
                    )
            );


            return String(
                assetId
            );
        }
    }


    throw new Error(
        `Upload timed out ${name}.`
    );
}


// ============================================================
// OPEN USE
// ============================================================

async function applyOpenUse(
    assetId,
    apiKey
) {

    await retryOperation(
        async () => {

            await axios.patch(
                'https://apis.roblox.com/asset-permissions-api/v1/assets/permissions',

                {
                    subjectType:
                        'All',

                    subjectId:
                        null,

                    action:
                        'Use',

                    requests: [
                        {
                            assetId:
                                Number(
                                    assetId
                                )
                        }
                    ]
                },

                {
                    headers: {
                        'x-api-key':
                            apiKey,

                        'Content-Type':
                            'application/json'
                    },

                    timeout:
                        8000
                }
            );
        },

        `Open Use ${assetId}`,

        1
    );
}


// ============================================================
// LUAU
// ============================================================

async function extractAllMeshIdsWithLuau(
    entries
) {

    const apiKey =
        process.env.ROBLOX_API_KEY;


    if (!apiKey) {

        throw new Error(
            'ROBLOX_API_KEY is missing'
        );
    }


    const modelsLua =
        entries
            .map(
                entry => {

                    const imageName =
                        JSON.stringify(
                            String(
                                entry.imageName
                            )
                        );


                    const modelId =
                        Number(
                            entry.modelId
                        );


                    if (
                        !Number.isFinite(
                            modelId
                        )
                    ) {

                        throw new Error(
                            `Invalid ModelID for ${entry.imageName}: ${entry.modelId}`
                        );
                    }


                    return (
                        `    {\n` +
                        `        imageName = ${imageName},\n` +
                        `        modelId = ${modelId}\n` +
                        `    }`
                    );
                }
            )
            .join(',\n');


    const luauScript = `

local InsertService =
    game:GetService("InsertService")

local HttpService =
    game:GetService("HttpService")

local models = {
${modelsLua}
}

local output = {}

for _, item in ipairs(models) do

    local success = false
    local result = nil

    for attempt = 1, 3 do

        success, result = pcall(function()

            local model =
                InsertService:LoadAsset(
                    item.modelId
                )

            if not model then
                error(
                    "InsertService did not return Model"
                )
            end

            local meshPart =
                model:FindFirstChildWhichIsA(
                    "MeshPart",
                    true
                )

            if not meshPart then
                error(
                    "MeshPart not found"
                )
            end

            local meshId =
                meshPart.MeshId

            local id =
                string.match(
                    tostring(meshId),
                    "%d+"
                )

            if not id then
                error(
                    "Could not extract MeshID"
                )
            end

            output[item.imageName] = id

        end)

        if success then
            break
        end

        warn(
            "[PortPack] LoadAsset failed for " ..
            item.imageName ..
            " (intento " ..
            tostring(attempt) ..
            "/3): " ..
            tostring(result)
        )

        if attempt < 3 then
            task.wait(2)
        end
    end

    if not success then

        error(
            item.imageName ..
            ": " ..
            tostring(result)
        )

    end

end

return HttpService
    :JSONEncode(
        output
    )

`;


    const createRes =
        await retryOperation(
            async () => {

                return axios.post(
                    `https://apis.roblox.com/cloud/v2/universes/${UNIVERSE_ID}/places/${PLACE_ID}/luau-execution-session-tasks`,

                    {
                        script:
                            luauScript
                    },

                    {
                        headers: {
                            'x-api-key':
                                apiKey,

                            'Content-Type':
                                'application/json'
                        },

                        timeout:
                            20000
                    }
                );
            },

            'Luau task creation',

            1
        );


    const taskPath =
        createRes.data?.path;


    if (!taskPath) {

        throw new Error(
            `Roblox didnt return task path:\n${JSON.stringify(
                createRes.data
            )}`
        );
    }


    for (
        let i = 0;
        i < LUAU_POLL_ATTEMPTS;
        i++
    ) {

        await sleep(
            LUAU_POLL_INTERVAL
        );


        const statusRes =
            await axios.get(
                `https://apis.roblox.com/cloud/v2/${taskPath}`,

                {
                    headers: {
                        'x-api-key':
                            apiKey
                    },

                    timeout:
                        8000
                }
            );


        const data =
            statusRes.data;


        console.log(
            `[LUAU] ${i + 1}: ${data?.state}`
        );


        if (
            data?.state ===
            'COMPLETE'
        ) {

            const raw =
                data
                    ?.output
                    ?.results?.[0];


            if (
                raw === undefined ||
                raw === null
            ) {

                throw new Error(
                    'Luauu finished but didnt return MeshIDs'
                );
            }


            try {

                const parsed =
                    typeof raw === 'string'
                        ? JSON.parse(
                            raw
                        )
                        : raw;


                if (
                    !parsed ||
                    typeof parsed !== 'object'
                ) {

                    throw new Error(
                        'Luaus response is not a valid object'
                    );
                }


                await applyOpenUseForMeshes(
                    parsed,
                    apiKey
                );


                return parsed;

            } catch (error) {

                throw new Error(
                    `The Luau response couldnt be interpreted: ${error.message}`
                );
            }
        }


        if (
            data?.state ===
                'FAILED' ||
            data?.state ===
                'CANCELLED'
        ) {

            throw new Error(
                `Luau failed: ${
                    data?.error?.message ||
                    JSON.stringify(
                        data?.error ||
                        data
                    )
                }`
            );
        }
    }


    throw new Error(
        'Timeout expired in Luauu'
    );
}


// ============================================================
// OPEN USE MESH
// ============================================================

async function applyOpenUseForMeshes(
    meshIds,
    apiKey
) {

    const ids =
        Object.values(
            meshIds || {}
        )
            .filter(Boolean);


    await Promise.all(
        ids.map(
            id =>
                applyOpenUse(
                    id,
                    apiKey
                ).catch(
                    error =>
                        console.warn(
                            `[ROBLOX] Open Use Mesh ${id}:`,
                            error.message
                        )
                )
        )
    );
}


// ============================================================
// CONCURRENCY
// ============================================================

async function runWithConcurrency(
    items,
    concurrency,
    worker
) {

    let nextIndex = 0;
    let firstError = null;


    async function runner() {

        while (true) {

            const index =
                nextIndex++;


            if (
                index >= items.length
            ) {

                return;
            }


            try {

                await worker(
                    items[index]
                );

            } catch (error) {

                if (!firstError) {

                    firstError =
                        error;
                }

                return;
            }
        }
    }


    const workers =
        Math.min(
            concurrency,
            items.length
        );


    await Promise.all(
        Array.from(
            {
                length:
                    workers
            },
            () =>
                runner()
        )
    );


    if (
        firstError
    ) {

        throw firstError;
    }
}


// ============================================================
// ZIP PATH
// ============================================================

function normalizeZipPath(
    filePath
) {

    return String(
        filePath
    )
        .replace(
            /\\/g,
            '/'
        )
        .replace(
            /^\/+/,
            ''
        )
        .replace(
            /\/+/g,
            '/'
        );
}


// ============================================================
// SANITIZE
// ============================================================

function sanitizeFileName(
    name
) {

    return String(
        name
    )
        .replace(
            /[^a-zA-Z0-9._-]/g,
            '_'
        );
}


// ============================================================
// RETRY
// ============================================================

async function retryOperation(
    operation,
    label,
    maxRetries = MAX_RETRIES
) {

    let lastError =
        null;


    for (
        let attempt = 0;
        attempt <= maxRetries;
        attempt++
    ) {

        try {

            if (
                attempt > 0
            ) {

                const delay =
                    RETRY_BASE_DELAY *
                    Math.pow(
                        2,
                        attempt - 1
                    );


                await sleep(
                    delay
                );
            }


            return await operation();

        } catch (error) {

            lastError =
                error;


            console.warn(
                `[RETRY] ${label} → ${attempt + 1}/${maxRetries + 1}: ${error.message}`
            );


            if (
                attempt >= maxRetries
            ) {

                break;
            }
        }
    }


    throw new Error(
        `${label} failed after ${maxRetries + 1} attemps\n\n${
            lastError?.message ||
            'Unknown error'
        }`
    );
}


// ============================================================
// PROGRESS
// ============================================================

async function updateProgress(
    interaction,
    percent,
    status
) {

    const safePercent =
        Math.max(
            0,
            Math.min(
                100,
                Math.round(
                    percent
                )
            )
        );


    const filled =
        Math.round(
            safePercent / 5
        );


    const bar =
        '█'.repeat(
            filled
        ) +
        '░'.repeat(
            20 - filled
        );


    return safeEditReply(
        interaction,
        {
            content:
                `## 📦 PortPack\n\n` +
                `**${safePercent}%**\n` +
                `\`${bar}\`\n\n` +
                `${status}`,

            components: []
        }
    );
}


// ============================================================
// SAFE EDIT
// ============================================================

async function safeEditReply(
    interaction,
    content
) {

    try {

        if (
            !interaction.deferred &&
            !interaction.replied
        ) {

            return false;
        }


        if (
            typeof content === 'string'
        ) {

            await interaction.editReply({
                content,
                components: []
            });

        } else {

            await interaction.editReply(
                content
            );
        }


        return true;

    } catch (error) {

        console.error(
            '[DISCORD] editReply:',
            error.message
        );

        return false;
    }
}


// ============================================================
// HTML ENTITIES
// ============================================================

function decodeHtmlEntities(
    value
) {

    return String(
        value
    )
        .replace(
            /&amp;/g,
            '&'
        )
        .replace(
            /&quot;/g,
            '"'
        )
        .replace(
            /&#39;/g,
            "'"
        )
        .replace(
            /&lt;/g,
            '<'
        )
        .replace(
            /&gt;/g,
            '>'
        );
}


// ============================================================
// SLEEP
// ============================================================

function sleep(
    ms
) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );
}