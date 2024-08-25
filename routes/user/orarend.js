const axios = require('axios');
const moment = require('moment');

module.exports = async function (req, res) {
    const { TOKEN, INSTITUTE } = req.body;

    if (!TOKEN || !INSTITUTE) {
        res.status(400).send("Missing parameters");
        return;
    }

    const fromDate = getCurrentMonday();
    const toDate = getCurrentFriday();

    //console.log(fromDate, toDate)

    const orarend = new Orarend(TOKEN, INSTITUTE, fromDate, toDate);
    try {
        const timetable = await orarend.getTimetable();

        res.status(200).json(timetable);
    }
    catch (error) {
        res.status(400).json(error);
    }
}

function getCurrentMonday() {
    const today = moment();
    const monday = today.day(1);
    return monday.format('YYYY-MM-DD');
}

function getCurrentFriday() {
    const today = moment();
    const friday = today.day(7);
    return friday.format('YYYY-MM-DD');
}

//console.log(getCurrentMonday(), getCurrentFriday());

class Orarend {
    constructor(token, ist, fromDate, toDate) {
        this.token = token;
        this.ist = ist;
        this.fromDate = fromDate;
        this.toDate = toDate;
    }

    async getTimetable() {
        const response = await axios.get(`https://${this.ist}.e-kreta.hu/ellenorzo/V3/Sajat/OrarendElemek?datumTol=${this.fromDate}&datumIg=${this.toDate}`, {
            headers: {
                "Authorization": "Bearer " + this.token,
                "User-Agent": "hu.ekreta.tanulo/1.0.5/Android/0/0"
            }
        });
        return response.data;
    }
}