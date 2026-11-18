// src/utils/formatRand.js
// 1842.5 -> "R1,842.50"
const formatRand = (amount) => {
  const [whole, cents] = (Math.round(amount * 100) / 100).toFixed(2).split(".");
  return `R${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${cents}`;
};

export default formatRand;
