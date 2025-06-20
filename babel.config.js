module.exports = {
    presets: [['@babel/preset-env', { targets: { node: 'current' } }], '@babel/preset-typescript'],
    plugins: [
        ['@babel/plugin-proposal-decorators', { legacy: true }],
        [
            '@babel/plugin-transform-runtime',
            {
                regenerator: true,
            },
        ],
    ],
};
