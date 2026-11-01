const {
    SlashCommandBuilder
} = require('discord.js');

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const {
    exec
} = require('child_process');

const util = require('util');

const execPromise =
    util.promisify(exec);


// ============================================================
// CONFIGURACIÓN
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


// ============================================================
// BLENDER
// ============================================================

const BLENDER_PATH =
    'C:\\Program Files\\Blender Foundation\\Blender 4.4\\blender.exe';


// ============================================================
// ROBLOX
// ============================================================

const UNIVERSE_ID =
    '10764746325';

const PLACE_ID =
    '113531224892646';


// ============================================================
// ROTACIÓN
// ============================================================

const ROTATION_X = 90;

const ROTATION_Y = -45;

const ROTATION_Z = 0;


// ============================================================
// SOLIDIFY
// ============================================================

const SOLIDIFY_THICKNESS = 0.10;


// ============================================================
// COMANDO
// ============================================================

module.exports = {

    data:
        new SlashCommandBuilder()

            .setName(
                'imagetomesh3id'
            )

            .setDescription(
                'Convierte una imagen Minecraft transparente en un MeshPart 3D'
            )

            .addAttachmentOption(
                option =>
                    option

                        .setName(
                            'imagen'
                        )

                        .setDescription(
                            'Imagen cuadrada transparente 16x16 hasta 512x512'
                        )

                        .setRequired(
                            true
                        )
            )

            .addBooleanOption(
                option =>
                    option

                        .setName(
                            'goldapple'
                        )

                        .setDescription(
                            '¿Es una GoldApple?'
                        )

                        .setRequired(
                            true
                        )
            ),


    // ========================================================
    // EXECUTE
    // ========================================================

    async execute(
        interaction
    ) {

        console.log(
            '[IMAGETOMESH3ID] Starting command...'
        );


        // ====================================================
        // VALIDAR ACK
        // ====================================================

        if (
            !interaction.deferred &&
            !interaction.replied
        ) {

            throw new Error(
                'La interacción no fue reconocida por Discord antes de ejecutar el comando.'
            );

        }


        // ====================================================
        // DATOS
        // ====================================================

        const attachment =
            interaction.options.getAttachment(
                'imagen'
            );


        const isGoldApple =
            interaction.options.getBoolean(
                'goldapple'
            );


        // ====================================================
        // VALIDAR ATTACHMENT
        // ====================================================

        if (
            !attachment
        ) {

            await safeEditReply(
                interaction,
                '❌ No se proporcionó ninguna imagen.'
            );

            return;

        }


        if (
            !attachment.contentType ||
            !attachment.contentType.startsWith(
                'image/'
            )
        ) {

            await safeEditReply(
                interaction,
                '❌ El archivo debe ser una imagen.'
            );

            return;

        }


        // ====================================================
        // TEMP
        // ====================================================

        const tempRoot =
            path.join(
                __dirname,
                '..',
                'temp'
            );


        if (
            !fs.existsSync(
                tempRoot
            )
        ) {

            fs.mkdirSync(
                tempRoot,
                {
                    recursive: true
                }
            );

        }


        const jobId =
            `imagetomesh_${Date.now()}`;


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


        const originalPath =
            path.join(
                tempDir,
                'original.png'
            );


        const texturePath =
            path.join(
                tempDir,
                'texture_1024.png'
            );


        const fbxPath =
            path.join(
                tempDir,
                'minecraft_mesh.fbx'
            );


        const blendPath =
            path.join(
                tempDir,
                'minecraft_mesh.blend'
            );


        // ====================================================
        // EJECUCIÓN
        // ====================================================

        try {

            // =================================================
            // DESCARGAR
            // =================================================

            await safeEditReply(
                interaction,
                '⏳ Descargando imagen...'
            );


            console.log(
                `[IMAGETOMESH3ID] Downloading ${attachment.url}`
            );


            const response =
                await axios.get(
                    attachment.url,
                    {
                        responseType:
                            'arraybuffer',

                        timeout:
                            30000,

                        maxContentLength:
                            25 * 1024 * 1024,

                        maxBodyLength:
                            25 * 1024 * 1024
                    }
                );


            fs.writeFileSync(
                originalPath,
                Buffer.from(
                    response.data
                )
            );


            // =================================================
            // METADATA
            // =================================================

            const metadata =
                await sharp(
                    originalPath
                ).metadata();


            const width =
                metadata.width;


            const height =
                metadata.height;


            console.log(
                `[IMAGETOMESH3ID] Input: ${width}x${height}`
            );


            // =================================================
            // VALIDAR CUADRADO
            // =================================================

            if (
                !width ||
                !height
            ) {

                throw new Error(
                    'No se pudo detectar la resolución de la imagen.'
                );

            }


            if (
                width !== height
            ) {

                await safeEditReply(

                    interaction,

                    `❌ La imagen debe ser cuadrada.\n\n` +
                    `Tu imagen es **${width}x${height}**.`

                );

                return;

            }


            // =================================================
            // VALIDAR RESOLUCIÓN
            // =================================================

            if (
                !VALID_SIZES.includes(
                    width
                )
            ) {

                await safeEditReply(

                    interaction,

                    `❌ Resolución no válida.\n\n` +

                    `Resoluciones permitidas:\n` +

                    `\`${VALID_SIZES
                        .map(
                            size =>
                                `${size}x${size}`
                        )
                        .join(', ')}\`\n\n` +

                    `Tu imagen es **${width}x${height}**.`

                );

                return;

            }


            // =================================================
            // TEXTURA 1024
            // =================================================

            await safeEditReply(

                interaction,

                `⏳ Preparando imagen...\n\n` +

                `📐 Original: **${width}x${height}**\n` +

                `🎨 Textura final: **${FINAL_SIZE}x${FINAL_SIZE}**\n\n` +

                `🧱 Analizando transparencia...`

            );


            await sharp(
                originalPath
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
                    texturePath
                );


            if (
                !fs.existsSync(
                    texturePath
                )
            ) {

                throw new Error(
                    'No se pudo crear la textura 1024x1024.'
                );

            }


            // =================================================
            // BLENDER
            // =================================================

            await safeEditReply(

                interaction,

                `⏳ **Blender está creando la geometría...**\n\n` +

                `📐 Resolución: **${width}x${height}**\n` +

                `🎨 Textura: **${FINAL_SIZE}x${FINAL_SIZE}**\n\n` +

                `🔍 Eliminando píxeles transparentes...\n` +

                `🧱 Aplicando Solidify...\n` +

                `📦 Preparando FBX...`

            );


            await generateMeshWithBlender(

                texturePath,

                originalPath,

                fbxPath,

                blendPath,

                width,

                ROTATION_X,

                ROTATION_Y,

                ROTATION_Z

            );


            // =================================================
            // VERIFICAR FBX
            // =================================================

            if (
                !fs.existsSync(
                    fbxPath
                )
            ) {

                throw new Error(
                    'Blender terminó pero no creó el FBX.'
                );

            }


            const fbxStats =
                fs.statSync(
                    fbxPath
                );


            if (
                fbxStats.size <= 0
            ) {

                throw new Error(
                    'El FBX creado está vacío.'
                );

            }


            console.log(
                `[IMAGETOMESH3ID] FBX created: ${fbxStats.size} bytes`
            );


            // =================================================
            // SUBIR TEXTURA
            // =================================================

            await safeEditReply(

                interaction,

                '⏳ Subiendo textura 1024x1024 a Roblox...'

            );


            const textureId =
                await uploadAsset(

                    texturePath,

                    'Image',

                    `Texture_${Date.now()}`

                );


            console.log(
                `[IMAGETOMESH3ID] TextureId: ${textureId}`
            );


            // =================================================
            // SUBIR MODELO
            // =================================================

            await safeEditReply(

                interaction,

                '⏳ Subiendo geometría 3D a Roblox...'

            );


            const modelId =
                await uploadAsset(

                    fbxPath,

                    'Model',

                    `MinecraftMesh_${Date.now()}`

                );


            console.log(
                `[IMAGETOMESH3ID] ModelId: ${modelId}`
            );


            // =================================================
            // EXTRAER MESH ID
            // =================================================

            await safeEditReply(

                interaction,

                '⏳ Roblox está procesando el MeshPart...'

            );


            const meshId =
                await extractMeshIdWithLuau(
                    modelId
                );


            // =================================================
            // RESULTADO
            // =================================================

            await safeEditReply(

                interaction,

                `✅ **¡Mesh generado correctamente!**\n\n` +

                `🧱 **MeshId / MeshContent:**\n` +

                `\`rbxassetid://${meshId}\`\n\n` +

                `🎨 **TextureId:**\n` +

                `\`rbxassetid://${textureId}\`\n\n` +

                `📐 **Imagen original:** ` +

                `${width}x${height}\n\n` +

                `📐 **Textura Roblox:** ` +

                `${FINAL_SIZE}x${FINAL_SIZE}\n\n` +

                `✂️ **Píxeles transparentes:** ` +

                `Eliminados de la geometría\n\n` +

                `🧱 **Solidify:** ` +

                `${SOLIDIFY_THICKNESS}\n\n` +

                `🍎 **GoldApple:** ` +

                `${isGoldApple ? 'Sí' : 'No'}\n\n` +

                `🔄 **Rotación:**\n` +

                `X: ${ROTATION_X}°\n` +

                `Y: ${ROTATION_Y}°\n` +

                `Z: ${ROTATION_Z}°\n\n` +

                `📦 **Model ID:** ` +

                `\`${modelId}\`\n\n` +

                `🎮 **Uso en Roblox Studio:**\n` +

                `Crea un MeshPart y coloca:\n\n` +

                `**MeshId:** ` +

                `rbxassetid://${meshId}\n\n` +

                `**TextureID:** ` +

                `rbxassetid://${textureId}`

            );


            console.log(
                '[IMAGETOMESH3ID] Completed successfully.'
            );


        } catch (error) {

            console.error(
                '[ERROR] /imagetomesh3id:',
                error
            );


            await safeEditReply(

                interaction,

                `❌ **Error:**\n` +

                `\`${String(
                    error?.message ||
                    'Ocurrió un error desconocido.'
                ).slice(0, 1800)}\``

            );


        } finally {

            // =================================================
            // LIMPIEZA
            // =================================================

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


                    console.log(
                        `[CLEANUP] Deleted ${tempDir}`
                    );

                }

            } catch (cleanupError) {

                console.warn(
                    '[CLEANUP] No se pudo eliminar temp:',
                    cleanupError.message
                );

            }

        }

    }

};


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
            `No existe create_image_mesh.py:\n${scriptPath}`
        );

    }


    if (
        !fs.existsSync(
            BLENDER_PATH
        )
    ) {

        throw new Error(
            `No se encontró Blender en:\n${BLENDER_PATH}`
        );

    }


    console.log(
        '[BLENDER] Starting...'
    );


    console.log(
        `[BLENDER] Texture: ${texturePath}`
    );


    console.log(
        `[BLENDER] Original: ${originalImagePath}`
    );


    console.log(
        `[BLENDER] FBX: ${fbxPath}`
    );


    // ========================================================
    // IMPORTANTE
    // ========================================================
    //
    // --factory-startup
    //
    // evita que Blender cargue addons del usuario.
    //
    // Esto elimina problemas como:
    //
    // Roblox Starter Rigs
    // Tripo3D
    // addons externos
    //
    // que estaban apareciendo en tu consola.
    // ========================================================


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


    console.log(
        '[BLENDER] Command prepared.'
    );


    let stdout = '';

    let stderr = '';


    try {

        const result =
            await execPromise(

                command,

                {

                    timeout:
                        180000,

                    maxBuffer:
                        50 * 1024 * 1024

                }

            );


        stdout =
            result.stdout ||
            '';

        stderr =
            result.stderr ||
            '';


    } catch (error) {

        stdout =
            error.stdout ||
            '';

        stderr =
            error.stderr ||
            '';


        console.error(
            '[BLENDER] Process error.'
        );


        if (
            stdout
        ) {

            console.error(
                '[BLENDER STDOUT]',
                stdout
            );

        }


        if (
            stderr
        ) {

            console.error(
                '[BLENDER STDERR]',
                stderr
            );

        }


        throw new Error(

            `Blender falló durante la generación del mesh.\n\n` +

            `${error.message || 'Error desconocido'}\n\n` +

            `Revisa la consola para ver el error de Python.`

        );

    }


    if (
        stdout
    ) {

        console.log(
            '[BLENDER STDOUT]',
            stdout
        );

    }


    if (
        stderr
    ) {

        console.log(
            '[BLENDER STDERR]',
            stderr
        );

    }


    // ========================================================
    // DETECTAR ERRORES REALES
    // ========================================================

    const blenderOutput =
        `${stdout}\n${stderr}`;


    // Solo consideramos error si nuestro script
    // realmente produjo un Traceback/SyntaxError.
    //
    // Los mensajes de addons externos quedan fuera
    // porque usamos --factory-startup.


    if (
        /create_image_mesh\.py.*SyntaxError:/is.test(
            blenderOutput
        )
    ) {

        throw new Error(

            `create_image_mesh.py tiene un error de Python:\n\n` +

            blenderOutput.slice(
                -8000
            )

        );

    }


    if (
        /File ".*create_image_mesh\.py".*line/i.test(
            blenderOutput
        ) &&
        /Traceback \(most recent call last\):/i.test(
            blenderOutput
        )
    ) {

        throw new Error(

            `El script de Blender produjo un error:\n\n` +

            blenderOutput.slice(
                -8000
            )

        );

    }


    // ========================================================
    // FBX
    // ========================================================

    if (
        !fs.existsSync(
            fbxPath
        )
    ) {

        throw new Error(

            `Blender terminó pero NO creó el FBX:\n` +

            `${fbxPath}`

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
            'El FBX fue creado pero está vacío.'
        );

    }


    console.log(
        `[BLENDER] FBX successfully created: ${stats.size} bytes`
    );


    if (
        fs.existsSync(
            blendPath
        )
    ) {

        console.log(
            `[BLENDER] Blend successfully created.`
        );

    }

}


// ============================================================
// ROBLOX ASSET UPLOAD
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
            'Faltan ROBLOX_API_KEY o ROBLOX_CREATOR_ID en .env.'
        );

    }


    if (
        !fs.existsSync(
            filePath
        )
    ) {

        throw new Error(
            `No existe el archivo:\n${filePath}`
        );

    }


    const stats =
        fs.statSync(
            filePath
        );


    if (
        stats.size <= 0
    ) {

        throw new Error(
            `El archivo está vacío:\n${filePath}`
        );

    }


    // ========================================================
    // FORM DATA
    // ========================================================

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


    const requestData = {

        assetType,

        displayName:
            name,

        description:
            'Generado automáticamente por RobloxImageBot',

        creationContext: {

            creator

        }

    };


    form.append(

        'request',

        JSON.stringify(
            requestData
        )

    );


    // ========================================================
    // CONTENT TYPE
    // ========================================================

    let contentType;


    if (
        assetType === 'Model'
    ) {

        contentType =
            'model/fbx';

    } else if (
        assetType === 'Image'
    ) {

        contentType =
            'image/png';

    } else {

        throw new Error(
            `AssetType no soportado: ${assetType}`
        );

    }


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

            contentType

        }

    );


    // ========================================================
    // CREAR ASSET
    // ========================================================

    let createRes;


    try {

        createRes =
            await axios.post(

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
                        60000

                }

            );


    } catch (error) {

        const details =
            error.response?.data
                ? JSON.stringify(
                    error.response.data
                )
                : error.message;


        throw new Error(
            `Roblox rechazó ${assetType}:\n${details}`
        );

    }


    const operationPath =
        createRes.data?.path;


    if (
        !operationPath
    ) {

        throw new Error(

            `Roblox no devolvió operation path:\n` +

            JSON.stringify(
                createRes.data
            )

        );

    }


    const operationId =
        operationPath
            .split('/')
            .pop();


    console.log(
        `[ROBLOX] Operation: ${operationId}`
    );


    // ========================================================
    // POLLING
    // ========================================================

    let assetId = null;


    for (
        let i = 0;
        i < 40;
        i++
    ) {

        await sleep(
            1500
        );


        try {

            const statusRes =
                await axios.get(

                    `https://apis.roblox.com/assets/v1/operations/${operationId}`,

                    {

                        headers: {

                            'x-api-key':
                                apiKey

                        },

                        timeout:
                            15000

                    }

                );


            const data =
                statusRes.data;


            console.log(

                `[ROBLOX] ${assetType} ${name} ` +

                `check ${i + 1}/40: ${data.done}`

            );


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


                assetId =
                    data.response?.assetId;


                if (
                    !assetId
                ) {

                    throw new Error(

                        `Roblox terminó pero no devolvió assetId:\n` +

                        JSON.stringify(
                            data
                        )

                    );

                }


                break;

            }


        } catch (error) {

            if (
                error.response
            ) {

                console.warn(

                    `[ROBLOX] Error checking operation ` +

                    `${i + 1}/40:`,

                    error.response.data ||
                    error.message

                );

            } else {

                throw error;

            }

        }

    }


    if (
        !assetId
    ) {

        throw new Error(
            `Tiempo de espera agotado subiendo ${name}.`
        );

    }


    console.log(
        `[ROBLOX] Asset created: ${assetId}`
    );


    // ========================================================
    // OPEN USE
    // ========================================================

    try {

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
                    15000

            }

        );


        console.log(
            `[ROBLOX] Open Use applied: ${assetId}`
        );


    } catch (error) {

        console.warn(

            '[ROBLOX] No se pudo aplicar Open Use:',

            error.response?.data ||
            error.message

        );

    }


    return String(
        assetId
    );

}


// ============================================================
// LUAU → MESH ID
// ============================================================

async function extractMeshIdWithLuau(
    modelId
) {

    const apiKey =
        process.env.ROBLOX_API_KEY;


    if (
        !apiKey
    ) {

        throw new Error(
            'Falta ROBLOX_API_KEY.'
        );

    }


    const luauScript = `

local InsertService = game:GetService("InsertService")

local success, result = pcall(function()

    local model = InsertService:LoadAsset(${modelId})

    if not model then
        error("InsertService no devolvió Model")
    end

    local meshPart =
        model:FindFirstChildWhichIsA(
            "MeshPart",
            true
        )

    if not meshPart then
        error("No se encontró ningún MeshPart")
    end

    local meshId = meshPart.MeshId

    local id =
        string.match(
            tostring(meshId),
            "%d+"
        )

    if not id then
        error("No se pudo extraer el MeshId")
    end

    return id

end)

if success then
    return result
else
    error(tostring(result))
end

`;


    // ========================================================
    // CREAR TASK
    // ========================================================

    let createRes;


    try {

        createRes =
            await axios.post(

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
                        30000

                }

            );


    } catch (error) {

        throw new Error(

            `Roblox rechazó la ejecución Luau:\n` +

            `${

                error.response?.data

                    ? JSON.stringify(
                        error.response.data
                    )

                    : error.message

            }`

        );

    }


    const taskPath =
        createRes.data?.path;


    if (
        !taskPath
    ) {

        throw new Error(
            'Roblox no devolvió task path para Luau.'
        );

    }


    console.log(
        `[LUAU] Task: ${taskPath}`
    );


    // ========================================================
    // POLLING
    // ========================================================

    let meshId = null;


    for (
        let i = 0;
        i < 30;
        i++
    ) {

        await sleep(
            2000
        );


        try {

            const statusRes =
                await axios.get(

                    `https://apis.roblox.com/cloud/v2/${taskPath}`,

                    {

                        headers: {

                            'x-api-key':
                                apiKey

                        },

                        timeout:
                            15000

                    }

                );


            const data =
                statusRes.data;


            const state =
                data?.state;


            console.log(
                `[LUAU] ${i + 1}/30: ${state}`
            );


            if (
                state === 'COMPLETE'
            ) {

                const results =
                    data
                        ?.output
                        ?.results;


                if (
                    results &&
                    results[0] !== undefined &&
                    results[0] !== null
                ) {

                    meshId =
                        String(
                            results[0]
                        );

                    break;

                }


                throw new Error(
                    'Luau terminó pero no devolvió MeshId.'
                );

            }


            if (
                state === 'FAILED' ||
                state === 'CANCELLED'
            ) {

                throw new Error(

                    `Luau falló: ` +

                    `${data?.error?.message ||
                        'Error desconocido'}`

                );

            }


        } catch (error) {

            if (
                error.response
            ) {

                console.warn(
                    `[LUAU] Error ${i + 1}/30:`,
                    error.response.data ||
                    error.message
                );

            } else {

                throw error;

            }

        }

    }


    if (
        !meshId
    ) {

        throw new Error(
            'Tiempo de espera agotado en Luau.'
        );

    }


    console.log(
        `[LUAU] MeshId extracted: ${meshId}`
    );


    // ========================================================
    // OPEN USE MESH
    // ========================================================

    try {

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
                                meshId
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
                    15000

            }

        );


        console.log(
            `[ROBLOX] Open Use applied to MeshId ${meshId}`
        );


    } catch (error) {

        console.warn(

            '[ROBLOX] No se pudo aplicar Open Use al MeshId:',

            error.response?.data ||
            error.message

        );

    }


    return meshId;

}


// ============================================================
// SAFE EDIT REPLY
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

            console.warn(
                '[DISCORD] Interaction no reconocida.'
            );

            return false;

        }


        await interaction.editReply(
            content
        );


        return true;


    } catch (error) {

        if (
            error?.code === 10062
        ) {

            console.error(
                '[DISCORD] Unknown interaction en editReply().'
            );

        } else {

            console.error(
                '[DISCORD] Error editReply():',
                error.message
            );

        }


        return false;

    }

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