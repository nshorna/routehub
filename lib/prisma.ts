import 'dotenv/config'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../lib/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// const adapter = new PrismaMariaDb(
//     {
//         database: String(process.env.DB_NAME),
//         user: String(process.env.DB_USER),
//         password: String(process.env.DB_PASSWORD),
//         host: String(process.env.DB_HOST),
//         port: parseInt(String(process.env.DB_PORT) || '3306'),
//     }, 
//     {
//     onConnectionError: (error) => {
//         console.error('onConnectionError: Error connecting to database:', error)
//         // Don't throw - let Prisma handle retries
//     }
// })

// Use postgres adapter
const adapter = new PrismaPg(
    {
        database: String(process.env.DB_NAME),
        user: String(process.env.DB_USER),
        password: String(process.env.DB_PASSWORD),
        host: String(process.env.DB_HOST),
        port: parseInt(String(process.env.DB_PORT) || '5432'),
    },
    {
        onConnectionError: (error) => {
            console.error('onConnectionError: Error connecting to database:', error)
            // Don't throw - let Prisma handle retries
        }
    }
)

export const prisma = new PrismaClient({
    adapter,
    // log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})