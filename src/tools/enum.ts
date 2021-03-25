export const convertToEnum = (v: any, en: any) => {
	return en[Object.keys(en).find((key) => en[key] === v)];
};
