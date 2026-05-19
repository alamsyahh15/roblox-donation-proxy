const https = require('https')

exports.handler = async (event) => {
    const userId = event.queryStringParameters?.userId

    if (!userId) {
        return {
            statusCode: 400,
            body: JSON.stringify({error: 'userId required'})
        }
    }

    return new Promise((resolve) => {
        https.get(
            `https://apis.roblox.com/game-passes/v1/users/${userId}/game-passes?count=100`,
            (apiRes) => {
                let body = ''
                apiRes.on('data', chunk => body += chunk)
                apiRes.on('end', () => {
                    try {
                        const gpData = JSON.parse(body)
                        if (!gpData.gamePasses) {
                            resolve({
                                statusCode: 200,
                                headers: {'Access-Control-Allow-Origin': '*'},
                                body: JSON.stringify({gamepasses: []})
                            })
                            return
                        }
                        const filtered = gpData.gamePasses.filter(gp =>
                            gp.creator.creatorType === 'User' &&
                            gp.creator.creatorId === parseInt(userId) &&
                            gp.isForSale === true &&
                            gp.price !== null
                        )
                        const gamepasses = filtered.map(gp => ({
                            gamepassId:  gp.gamePassId,
                            name:        gp.name,
                            price:       gp.price,
                            iconImageId: gp.iconAssetId
                                ? `rbxassetid://${gp.iconAssetId}`
                                : '',
                        }))
                        resolve({
                            statusCode: 200,
                            headers: {'Access-Control-Allow-Origin': '*'},
                            body: JSON.stringify({gamepasses})
                        })
                    } catch(e) {
                        resolve({
                            statusCode: 500,
                            body: JSON.stringify({error: e.message})
                        })
                    }
                })
            }
        ).on('error', (e) => {
            resolve({
                statusCode: 500,
                body: JSON.stringify({error: e.message})
            })
        })
    })
}