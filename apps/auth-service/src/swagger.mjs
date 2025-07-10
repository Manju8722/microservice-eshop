import swaggerAutogen from 'swagger-autogen';

const doc = {
    infor: {
        title: "Auth Service API",
        description: "Automatically generated Swagger docs",
        version: '1.0.0'
    },
    host: "localhost:6001",
    schemas: ['http'],
    basePath: '/api'

}

const outputFile = './swagger-output.json';
const endPoints = ['./routes/auth.route.ts'];

swaggerAutogen()(outputFile, endPoints, doc);