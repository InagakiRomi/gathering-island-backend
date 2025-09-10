module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    rootDir: './',
    moduleFileExtensions: ['js', 'json', 'ts'],
    testRegex: '.*\\.spec\\.ts$',
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    collectCoverageFrom: ['**/*.(t|j)s'],
    coverageDirectory: './coverage',
    testPathIgnorePatterns: ['/node_modules/'],

    moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    },
};