import { useRef } from "react";
import type { JSX } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import type { TopdownState } from "@game/types/topdownState";
import type { TopdownMap } from "@game/maps/topdown_test";

const COLOR_PICKUP = "#ffe600";
const COLOR_DELIVERY = "#39ff14";

interface Props {
  stateRef: React.RefObject<TopdownState>;
  map: TopdownMap;
}

export function DeliverySprite({ stateRef, map }: Props): JSX.Element {
  const pickupRef = useRef<Mesh>(null);
  const deliveryRef = useRef<Mesh>(null);

  useFrame(() => {
    const pickupMesh = pickupRef.current;
    const deliveryMesh = deliveryRef.current;
    if (pickupMesh === null || deliveryMesh === null) return;

    const { delivery } = stateRef.current;
    pickupMesh.visible = !delivery.cargoPickedUp;
    deliveryMesh.visible = delivery.cargoPickedUp && !delivery.cargoDelivered;
  });

  return (
    <>
      <mesh
        ref={pickupRef}
        position={[map.pickupPosition.x, map.pickupPosition.y, 0]}
        visible={true}
      >
        <ringGeometry args={[0.6, 0.8, 16]} />
        <meshBasicMaterial color={COLOR_PICKUP} />
      </mesh>
      <mesh
        ref={deliveryRef}
        position={[map.deliveryPosition.x, map.deliveryPosition.y, 0]}
        visible={false}
      >
        <ringGeometry args={[0.6, 0.8, 16]} />
        <meshBasicMaterial color={COLOR_DELIVERY} />
      </mesh>
    </>
  );
}
