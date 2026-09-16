import * as THREE from 'three';

const EYE_MESH_NAMES = ['tripo_part_33', 'tripo_part_34'];
const UPPER_LIP_MESH_NAME = 'tripo_part_24';
const LOWER_LIP_MESH_NAME = 'tripo_part_25';
const EYE_PIVOT_DEPTH = 0.018;
const IRIS_FRONT_OFFSET = 0.0045;
const IRIS_SCALE = new THREE.Vector3(0.82, 0.8, 0.8);
const LOWER_LIP_HINGE = new THREE.Vector3(0.2395, 0.079, 0.0016);
const EYELID_FRONT_OFFSET = 0.006;
const BLINK_LINE_FRONT_OFFSET = 0.009;

const getParentLocalBounds = (mesh) => {
    mesh.geometry.computeBoundingBox();
    mesh.updateMatrix();
    return mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrix);
};

const createEyeRigs = (modelScene) => {
    const eyeRigs = [];
    const scleraMaterial = new THREE.MeshBasicMaterial({
        color: '#c9c6bc',
        side: THREE.DoubleSide,
        toneMapped: false
    });

    EYE_MESH_NAMES.forEach((meshName) => {
        const eye = modelScene.getObjectByName(meshName);
        if (!eye?.isMesh || !eye.geometry || !eye.parent) return;

        const parent = eye.parent;
        const eyeBounds = getParentLocalBounds(eye);
        const eyeCenter = eyeBounds.getCenter(new THREE.Vector3());
        const eyeSize = eyeBounds.getSize(new THREE.Vector3());

        // Twardówka ma osobny pivot mrugania. Stabilny parent gazePivot nie jest
        // skalowany, więc worldToLocal nie dostaje prawie osobliwej macierzy.
        const sclera = eye.clone(false);
        sclera.name = `${meshName}-sclera`;
        sclera.material = scleraMaterial;
        sclera.userData.isPortraitSclera = true;
        parent.add(sclera);

        const scleraBlinkPivot = new THREE.Group();
        scleraBlinkPivot.name = `${meshName}-sclera-blink-pivot`;
        scleraBlinkPivot.position.copy(eyeCenter);
        parent.add(scleraBlinkPivot);
        parent.updateWorldMatrix(true, true);
        scleraBlinkPivot.attach(sclera);

        const gazePivot = new THREE.Group();
        gazePivot.name = `${meshName}-gaze-pivot`;
        gazePivot.position.copy(eyeCenter).add(new THREE.Vector3(-EYE_PIVOT_DEPTH, 0, 0));
        gazePivot.userData.eyeMeshName = meshName;
        parent.add(gazePivot);

        // Origin teksturowanego oka leży w środku całego modelu. Ten drugi
        // pivot pozwala skalować tęczówkę dokładnie wokół środka oka.
        const irisCenter = new THREE.Group();
        irisCenter.name = `${meshName}-iris-center`;
        irisCenter.position.set(EYE_PIVOT_DEPTH, 0, 0);
        gazePivot.add(irisCenter);

        parent.updateWorldMatrix(true, true);
        irisCenter.attach(eye);
        irisCenter.scale.copy(IRIS_SCALE);
        irisCenter.position.x += IRIS_FRONT_OFFSET;

        // Model nie ma osobnych powiek ani morph targetów. Przy końcu mrugnięcia
        // skórny kształt oka przykrywa skompresowaną gałkę, a cienka linia daje
        // jednoznaczny kadr zamkniętego oka zamiast pozostawienia białej szczeliny.
        const eyelidCover = eye.clone(false);
        eyelidCover.name = `${meshName}-eyelid-cover`;
        eyelidCover.material = new THREE.MeshBasicMaterial({
            color: '#c5b497',
            transparent: true,
            opacity: 0,
            depthWrite: false,
            side: THREE.DoubleSide,
            toneMapped: false
        });
        eyelidCover.position.x += EYELID_FRONT_OFFSET;
        eyelidCover.visible = false;
        eyelidCover.renderOrder = 30;
        eyelidCover.userData.isPortraitEyelidCover = true;
        parent.add(eyelidCover);

        const blinkLine = new THREE.Mesh(
            new THREE.PlaneGeometry(
                Math.max(eyeSize.z * 0.72, 0.035),
                Math.max(eyeSize.y * 0.065, 0.0022)
            ),
            new THREE.MeshBasicMaterial({
                color: '#4a3328',
                transparent: true,
                opacity: 0,
                depthWrite: false,
                side: THREE.DoubleSide,
                toneMapped: false
            })
        );
        blinkLine.name = `${meshName}-blink-line`;
        blinkLine.position.set(
            eyeCenter.x + BLINK_LINE_FRONT_OFFSET,
            eyeCenter.y - (eyeSize.y * 0.025),
            eyeCenter.z
        );
        blinkLine.rotation.y = Math.PI / 2;
        blinkLine.visible = false;
        blinkLine.renderOrder = 31;
        blinkLine.userData.isPortraitBlinkLine = true;
        parent.add(blinkLine);

        eyeRigs.push({
            pivot: gazePivot,
            neutralPosition: gazePivot.position.clone(),
            scleraBlinkPivot,
            scleraBlinkNeutralPosition: scleraBlinkPivot.position.clone(),
            sclera,
            irisCenter,
            irisCenterNeutralPosition: irisCenter.position.clone(),
            irisBaseScaleY: IRIS_SCALE.y,
            iris: eye,
            eyelidCover,
            blinkLine
        });
    });

    return eyeRigs;
};

const createMouthRig = (modelScene) => {
    const upperLip = modelScene.getObjectByName(UPPER_LIP_MESH_NAME);
    const lowerLip = modelScene.getObjectByName(LOWER_LIP_MESH_NAME);

    if (
        !upperLip?.isMesh
        || !lowerLip?.isMesh
        || !upperLip.geometry
        || !lowerLip.geometry
        || !upperLip.parent
        || upperLip.parent !== lowerLip.parent
    ) {
        return null;
    }

    const parent = upperLip.parent;
    const upperBounds = getParentLocalBounds(upperLip);
    const lowerBounds = getParentLocalBounds(lowerLip);
    const upperCenter = upperBounds.getCenter(new THREE.Vector3());
    const mouthCenterZ = (upperCenter.z + lowerBounds.getCenter(new THREE.Vector3()).z) / 2;

    // Root kontroluje wyłącznie szerokość ust dla EE / OH / OU.
    const root = new THREE.Group();
    root.name = 'female-portrait-mouth-root';
    root.position.set(LOWER_LIP_HINGE.x, LOWER_LIP_HINGE.y, mouthCenterZ);
    parent.add(root);

    const upperPivot = new THREE.Group();
    upperPivot.name = 'female-portrait-upper-lip-pivot';
    upperPivot.position.copy(upperCenter);
    parent.add(upperPivot);
    parent.updateWorldMatrix(true, true);
    upperPivot.attach(upperLip);
    root.attach(upperPivot);

    const lowerPivot = new THREE.Group();
    lowerPivot.name = 'female-portrait-lower-lip-pivot';
    lowerPivot.position.copy(LOWER_LIP_HINGE);
    parent.add(lowerPivot);
    parent.updateWorldMatrix(true, true);
    lowerPivot.attach(lowerLip);
    root.attach(lowerPivot);

    // Model nie zawiera jamy ustnej ani zębów. Ciemna elipsa pozostaje ukryta
    // przy zamkniętych ustach i zapobiega pokazaniu tekstury skóry przy mowie.
    const cavityMaterial = new THREE.MeshBasicMaterial({
        color: '#321719',
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false
    });
    const cavity = new THREE.Mesh(
        new THREE.CircleGeometry(0.5, 40),
        cavityMaterial
    );
    cavity.name = 'female-portrait-mouth-cavity';
    cavity.position.set(0.043, -0.0044, 0);
    cavity.rotation.y = Math.PI / 2;
    cavity.scale.set(0.078, 0.028, 1);
    cavity.visible = false;
    cavity.renderOrder = 20;
    cavity.userData.isPortraitMouthCavity = true;
    root.add(cavity);

    return {
        root,
        upperPivot,
        lowerPivot,
        cavity,
        upperNeutralPosition: upperPivot.position.clone(),
        upperNeutralRotation: upperPivot.rotation.clone(),
        lowerNeutralPosition: lowerPivot.position.clone(),
        lowerNeutralRotation: lowerPivot.rotation.clone(),
        cavityBaseScale: cavity.scale.clone()
    };
};

/**
 * Buduje programowy rig twarzy bez modyfikowania geometrii współdzielonej
 * z cache useGLTF: spojrzenie, mruganie i dwa niezależne segmenty ust.
 */
const createPortraitFaceRig = (sourceScene) => {
    const modelScene = sourceScene.clone(true);
    modelScene.updateMatrixWorld(true);

    const eyeRigs = createEyeRigs(modelScene);
    const mouthRig = createMouthRig(modelScene);

    modelScene.updateMatrixWorld(true);
    return { modelScene, eyeRigs, mouthRig };
};

export default createPortraitFaceRig;
