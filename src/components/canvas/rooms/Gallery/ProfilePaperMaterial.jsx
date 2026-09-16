import { forwardRef } from 'react';
import { useTexture } from '@react-three/drei';
import { SRGBColorSpace } from 'three';
import PaperMaterial from './PaperMaterial';

const ProfilePaperMaterial = forwardRef(function ProfilePaperMaterial({ photoUrl, signatureUrl, ...props }, ref) {
    const [photo, signature] = useTexture([photoUrl, signatureUrl], (textures) => {
        textures.forEach((texture) => { texture.colorSpace = SRGBColorSpace; });
    });

    return <PaperMaterial {...props} ref={ref} profilePhoto={photo} profileSignature={signature} />;
});

export default ProfilePaperMaterial;
