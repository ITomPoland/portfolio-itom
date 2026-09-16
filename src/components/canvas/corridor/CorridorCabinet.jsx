const CorridorCabinet = ({
    name = 'corridor-cabinet',
    position,
    depth = 0.5,
    height = 1,
    width = 0.8,
    frontTexture,
    restTexture
}) => (
    <mesh name={name} position={position}>
        <boxGeometry args={[depth, height, width]} />

        {/* +X: ściana, -X: front zwrócony do wnętrza korytarza. */}
        <meshBasicMaterial color="#e0e0e0" attach="material-0" map={restTexture} />
        <meshBasicMaterial color="#e0e0e0" attach="material-1" map={frontTexture} />
        <meshBasicMaterial color="#e0e0e0" attach="material-2" map={restTexture} />
        <meshBasicMaterial color="#e0e0e0" attach="material-3" map={restTexture} />
        <meshBasicMaterial color="#e0e0e0" attach="material-4" map={restTexture} />
        <meshBasicMaterial color="#e0e0e0" attach="material-5" map={restTexture} />
    </mesh>
);

export default CorridorCabinet;
