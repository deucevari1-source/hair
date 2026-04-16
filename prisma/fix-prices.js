/**
 * Updates product and course prices to correct BYN values
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = [
    { name: 'Шампунь восстанавливающий', price: 45 },
    { name: 'Маска для волос',           price: 65 },
    { name: 'Масло для кончиков',        price: 48 },
    { name: 'Термозащитный спрей',       price: 35 },
    { name: 'Сухой шампунь',             price: 18 },
    { name: 'Текстурирующий спрей',      price: 55 },
    { name: 'Кондиционер питательный',   price: 38 },
    { name: 'Лак для волос сильной фиксации', price: 22 },
  ];

  for (const { name, price } of products) {
    const updated = await prisma.product.updateMany({ where: { name }, data: { price } });
    console.log(`${updated.count ? '✅' : '⚠️ not found'} ${name}: ${price} BYN`);
  }

  const courses = [
    { title: 'Основы женской стрижки',                    price: 290 },
    { title: 'Балаяж & Airtouch',                         price: 410 },
    { title: 'Мужские стрижки: от классики до барбершопа', price: 240 },
    { title: 'Кератин и ботокс для волос',                price: 190 },
  ];

  for (const { title, price } of courses) {
    const updated = await prisma.course.updateMany({ where: { title }, data: { price } });
    console.log(`${updated.count ? '✅' : '⚠️ not found'} ${title}: ${price} BYN`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
