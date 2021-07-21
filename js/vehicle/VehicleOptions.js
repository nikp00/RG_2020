import EmergencyLights from "../props/EmergencyLights.js";
import KERS from "../props/KERS.js";

// Template:
/*{
	vehicleID: {
		name: < display name >,
		thumbnail: < path to thumbnail img >,
		url: < path to GLTF model >,
		stats: {
			maxSpeed: < max speed >,
			maxEngineForce: < max engine force >,
			maxBreakingForce: < max breaking force (big values may cause the car to flip on breaking) >,
			mass: < mass of the vehicle >,
			friction: < friction between the chassis of the vehicle and the ground (used only if the vehicle flips over) >,
			maxSuspensionTravelCm: < max suspension travel >,
			suspensionStiffness: < suspension stiffness [20 - 10000] >,
			wheelsDampingCompression: < k * 2.0 * btSqrt(m_suspensionStiffness) 0.1 <= k <= 0.3 >,
			wheelsDampingRelaxation: < k * 2.0 * btSqrt(m_suspensionStiffness) 0.2 <= k <= 0.5 >,
			frictionSlip: < friction between the wheels and the ground >,
			rollInfluence: < roll influence (tested only with value set to 0.0) >,
			suspensionRestLength: < suspension rest length >,
			steering: {
				clamp: < max steering >,
				steeringIncrement: < steering increment > ,
				c: < constant used in the function used to calculate the relative steering angle (recommended value: 59) >,
				k: < offset used in the function used to calculate the relative steering angle (recommended value: 0.1) >,
			},
		},
		lights: {
			diffuse: < diffuse values for the headlights (vec3) >,
			specular: < specular values for the headlights (vec3) >,
			direction: < direction vector the headlights are pointing at (vec3) >,
			innerCutOff: < inner cutoff of the headlights beam >,
			outerCutOff: < outer cutoff of the headlights beam >,
			cutOff: < cutoff of the headlights beam >,
			attenuation: < attenuation of the headlights (vec3) > ,
			rotateOrigin: {
				axes: < axes around which to rotate the headlights [ "X", "Y", "Z" ] >,
				angle: < angle in degrees >,
			},
		},
		props: {
				propName < same as in the GLTF model >: {
				propType: < class of the prop (built in are EmergencyLights and KERS) >,
				nodes: < array of nodes which are part of the prop >,
				options: < object of options required by the class of the selected prop >
			},
		},
	},

		} 
	}
}*/

export const availableVehicles = {
    formula: {
        name: "Formula",
        thumbnail: "/RG_2020/assets/models/vehicle/formula/thumbnail.jpg",
        url: "/RG_2020/assets/models/vehicle/formula/formula.gltf",
        stats: {
            maxSpeed: 80,
            maxEngineForce: 10000,
            maxBreakingForce: 80,
            mass: 1500,
            friction: 100,
            maxSuspensionTravelCm: 10,
            suspensionStiffness: 200,
            wheelsDampingCompression: 5.7,
            wheelsDampingRelaxation: 8.5,
            frictionSlip: 1000,
            rollInfluence: 0,
            suspensionRestLength: 0.09,
            steering: {
                clamp: 0.6,
                steeringIncrement: 0.02,
                c: 59,
                k: 0.1,
            },
        },
        lights: {
            diffuse: [14, 13, 12],
            specular: [1, 1, 1],
            direction: [0, 0, 1],
            innerCutOff: 5,
            outerCutOff: 20.5,
            cutOff: 25,
            attenuation: [0.15, 0.15, 0.15],
            rotateOrigin: {
                axes: "X",
                angle: 4,
            },
        },
        props: {
            prop_kers: {
                propType: KERS,
                nodes: ["prop_kers"],
                options: {
                    duration: 5,
                    coolOff: 20,
                    angle: { x: -20, y: 0, z: 0 },
                    powerBoost: 1.5,
                    speedBoost: 1.2,
                },
            },
        },
    },
    police: {
        thumbnail: "/RG_2020/assets/models/vehicle/police/thumbnail.jpg",
        url: "/RG_2020/assets/models/vehicle/police/police.gltf",
        name: "Police",
        stats: {
            maxSpeed: 50,
            maxEngineForce: 5000,
            maxBreakingForce: 75,
            mass: 2000,
            friction: 100,
            maxSuspensionTravelCm: 28,
            suspensionStiffness: 50,
            wheelsDampingCompression: 4.2,
            wheelsDampingRelaxation: 6.3,
            frictionSlip: 80,
            rollInfluence: 0,
            suspensionRestLength: 0.3,
            steering: {
                clamp: 0.5,
                steeringIncrement: 0.03,
                c: 59,
                k: 0.1,
            },
        },
        lights: {
            diffuse: [14, 13, 12],
            specular: [1, 1, 1],
            direction: [0, 0, 1],
            innerCutOff: 5,
            outerCutOff: 20.5,
            cutOff: 25,
            attenuation: [0.15, 0.15, 0.15],
            rotateOrigin: {
                axes: "X",
                angle: 4,
            },
        },
        props: {
            emergencyLights: {
                propType: EmergencyLights,
                nodes: [
                    "prop_light_red_roof",
                    "prop_light_red_bar",
                    "prop_light_blue_bar",
                    "prop_light_blue_roof",
                ],
                options: {
                    duration: 10,
                    coolOff: 30,
                    powerBoost: 1.5,
                    speedBoost: 1.2,
                    interval: 1,
                    red: {
                        prop_light_red_roof: {
                            diffuse: [20, 0, 0],
                            specular: [0, 0, 0],
                            attenuation: [1, 1, 1],
                        },
                        prop_light_red_bar: {
                            diffuse: [20, 0, 0],
                            specular: [0, 0, 0],
                            attenuation: [1, 1, 1],
                        },
                    },
                    blue: {
                        prop_light_blue_bar: {
                            diffuse: [0, 0, 20],
                            specular: [0, 0, 0],
                            attenuation: [1, 1, 1],
                        },
                        prop_light_blue_roof: {
                            diffuse: [0, 0, 20],
                            specular: [0, 0, 0],
                            attenuation: [1, 1, 1],
                        },
                    },
                },
            },
        },
    },
};
