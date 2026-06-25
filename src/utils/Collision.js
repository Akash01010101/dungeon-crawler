export function checkCollision(entityA, entityB) {
    if (!entityA.sprite || !entityB.sprite) return false;
    
    // Simple AABB (Axis-Aligned Bounding Box) collision or distance check
    // Here we'll just use a simple distance check for ease of demonstration
    const dx = entityA.x - entityB.x;
    const dy = entityA.y - entityB.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Assuming each entity has roughly a radius of 20
    return distance < 40;
}
