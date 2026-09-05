const mongoose = require("mongoose");
module.exports = async () => {
	const connectionParams = {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	}
        mongoose.set('strictQuery', true)
		await mongoose.connect(process.env.DB, connectionParams);
};