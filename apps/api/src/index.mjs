import Fastify from 'fastify';
import cssToTailwind from 'css-to-tailwind';

const fastify = Fastify({
  logger: true,
});

fastify.get('/', async (request, reply) => {
  reply.type('application/json').code(200);
  return { hello: 'world' };
});

fastify.get('/css-to-tailwind', async (request, reply) => {
  const inputCss = `
.foo {
    color: red;
    background-color: blue;
}
    `;

  const result = await cssToTailwind(inputCss);

  return result;
});

fastify.listen({ port: 8080 }, (err, address) => {
  if (err) throw err;
  // Server is now listening on ${address}
});
