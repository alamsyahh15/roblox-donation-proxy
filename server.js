const http = require('http')
const https = require('https')

const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost')
    const userId = url.searchParams.get('userId')

    if (!userId) {
        res.writeHead(400, {'Content-Type': 'application/json'})
        res.end(JSON.stringify({error: 'userId required'}))
        return
    }

    https.get(
        `https://apis.roblox.com/game-passes/v1/users/${userId}/game-passes?count=100`,
        (apiRes) => {
            let body = ''
            apiRes.on('data', chunk => body += chunk)
            apiRes.on('end', () => {
                try {
                    const gpData = JSON.parse(body)
                    if (!gpData.gamePasses) {
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify({gamepasses: []}))
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
                        iconImageId: gp.iconAssetId ? `rbxassetid://${gp.iconAssetId}` : '',
                    }))
                    res.writeHead(200, {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    })
                    res.end(JSON.stringify({gamepasses}))
                } catch(e) {
                    res.writeHead(500)
                    res.end(JSON.stringify({error: e.message}))
                }
            })
        }
    ).on('error', (e) => {
        res.writeHead(500)
        res.end(JSON.stringify({error: e.message}))
    })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))
