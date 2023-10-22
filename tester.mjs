const url = process.env.URL;

console.log("unsafe");
const results = await Promise.all([0,1,2,3,4,5,6,7,8,9].map(async () => {
	const createRes = await fetch(url + "create/");
	if (!createRes.ok) {
		throw new Error(createRes);
	}
	const couponValue = (await createRes.json()).coupon;

	return await Promise.all([0, 1, 2].map(async (idx) => {
		const applyRes = await fetch(url + "apply/" + couponValue);
		if (!applyRes.ok) {
			return false
		}
		return true;
	}));
}));
console.log(results);

console.log("safe");
const safeResults = await Promise.all([0,1,2,3,4,5,6,7,8,9].map(async () => {
	const createRes = await fetch(url + "create/");
	if (!createRes.ok) {
		throw new Error(createRes);
	}
	const couponValue = (await createRes.json()).coupon;

	return await Promise.all([0, 1, 2].map(async (idx) => {
		const applyRes = await fetch(url + "apply_safe/" + couponValue);
		if (!applyRes.ok) {
			return false
		}
		return true;
	}));
}));
console.log(safeResults);
