// cooldownManager.js
const cooldowns = new Map();

function getRemainingCooldown(commandName, userId, cooldownSeconds) {
    const key = `${commandName}:${userId}`;
    const lastUsed = cooldowns.get(key);

    if (!lastUsed) {
        return 0;
    }

    const cooldownMs = cooldownSeconds * 1000;
    const elapsed = Date.now() - lastUsed;
    const remaining = cooldownMs - elapsed;

    if (remaining <= 0) {
        cooldowns.delete(key);
        return 0;
    }

    return remaining;
}

function setCooldown(commandName, userId) {
    const key = `${commandName}:${userId}`;
    cooldowns.set(key, Date.now());
}

module.exports = {
    getRemainingCooldown,
    setCooldown,
};