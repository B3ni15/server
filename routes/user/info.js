const axios = require('axios');

module.exports = async function (req, res) {
    const { TOKEN, INSTITUTE } = req.body;

    if (!TOKEN || !INSTITUTE) {
        res.status(400).send("Missing parameters");
        return;
    }

    try {
        const response = await axios.get(`https://${INSTITUTE}.e-kreta.hu/ellenorzo/V3/Sajat/TanuloAdatlap`, {
            headers: {
                "Authorization": "Bearer " + TOKEN,
                "User-Agent": "hu.ekreta.tanulo/1.0.5/Android/0/0"
            }
        });
        res.status(200).json({
            success: true,
            message: 'User info fetched successfully',
            data: response.data,
        });
    }
    catch (error) {
        res.status(400).json(error);
    }
}