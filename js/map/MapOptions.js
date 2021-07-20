// Template
/* {
	mapID: {
		thumbnail: < path to thumbnail img >,
		name: < map display name >,
		url: < path to GLTF model >,
		skyBoxUrl: < path to skybox GLTF model >,
		startLocation: < vehicle start location (vec3) >,
		startRotation: < vehicle start rotation (object {x: [], y: [], z: []})>,},
		cameraStart < camera start location and rotation used for animation > :{
			rotation: < object {x: [], y: [], z: []} >,
			translation: < vec3 >,
		},
		trackFriction: < friction of the track (tested with value 1.0) >,
		grassFriction: < friction of other surfaces (tested with value 0.5) >,
		directionalLight < properties for the directional light that illuminates the map >: {
			diffuse: < diffuse values (vec3) >,
			specular: < specular values (vec3) >,
			direction: < direction vector the light (vec3) >,
		},
		ambientLight < properties of the ambient light of the map >: {
			intensity: < intensity (vec3) >,
		},
		spotLight: < 
			Object containing the properties of the spotlights on the map.
			Each key of this object represents a group of spotlights on the map defined in the GLTF model.
			Each group must contain the  diffuse, specular, direction, innerCutOff, outerCutOff, cutOff, attenuation and rotateOrigin properties.
		>, 
		pointLight: < 
			Object containing the properties of the point lights on the map.
			Each key of this object represents a group of point lights on the map defined in the GLTF model.
			Each group must contain the  diffuse, specular, and attenuation properties.
		>,
		props < object containing the props that must be updated on each render cycle (builtin are only the movable_props) >: {
			movable_props < object containing the groups of movable props defined in the GTLF model, each group must have mass and friction properties >: {
				wheels: {
					mass: 10,
					friction: 100,
				},
			},
		},
	},
} */

export const availableMaps = {
    nightIsland: {
        thumbnail: "../../assets/models/map/night_island/thumbnail.jpg",
        name: "Night island",
        url: "../../assets/models/map/night_island/night_island.GLTF",
        skyBoxUrl: "../../assets/models/skybox/night.GLTF",
        startLocation: [-100, -9, 71],
        startRotation: {
            x: 0,
            y: 0,
            z: 0,
        },
        cameraStart: {
            rotation: { x: -150, y: 45, z: 75 },
            test: [0, 0, 0],
            translation: [50, 300, -50],
        },
        trackFriction: 1.0,
        grassFriction: 0.5,
        directionalLight: {
            diffuse: [0.16, 0.15, 0.15],
            specular: [0.05, 0.05, 0.05],
            direction: [1, -1, 0],
        },
        ambientLight: {
            intensity: [0.015, 0.01, 0.01],
        },
        spotLight: {
            street_light: {
                diffuse: [6, 5, 4],
                specular: [1, 1, 1],
                direction: [-2, -1, 0],
                innerCutOff: 5,
                outerCutOff: 70,
                cutOff: 80,
                attenuation: [0.2, 0.2, 0.2],
                rotateOrigin: {
                    axes: "Z",
                    angle: -25,
                },
            },
        },
        pointLight: {
            moon: {
                diffuse: [150, 150, 150],
                specular: [0, 0, 0],
                attenuation: [0.1, 0.1, 0.1],
            },
            black_light: {
                diffuse: [-10, -10, -10],
                specular: [0, 0, 0],
                attenuation: [0.3, 0.3, 0.3],
            },
        },
        props: {
            movable_props: {
                wheels_block: {
                    mass: 1000,
                    friction: 100,
                },
                wheels: {
                    mass: 10,
                    friction: 100,
                },
                fence: {
                    mass: 25,
                    friction: 100,
                },
            },
        },
    },
    desertIsland: {
        thumbnail: "../../assets/models/map/desert_island/thumbnail.jpg",
        name: "Desert island",
        url: "../../assets/models/map/desert_island/desert_island.gltf",
        skyBoxUrl: "../../assets/models/skybox/day.gltf",
        startLocation: [-41, -5, -30],
        startRotation: {
            x: 0,
            y: 0,
            z: 0,
        },
        cameraStart: {
            rotation: { x: -150, y: 0, z: 0 },
            translation: [0, 300, -200],
        },
        trackFriction: 1.0,
        grassFriction: 0.5,
        directionalLight: {
            diffuse: [0.7, 0.65, 0.65],
            specular: [0.1, 0.1, 0.1],
            direction: [1, -1, 0],
        },
        ambientLight: {
            intensity: [0.5, 0.5, 0.5],
        },
        spotLight: {},
        pointLight: {
            black_lights: {
                diffuse: [-5, -5, -5],
                specular: [0, 0, 0],
                attenuation: [0.4, 0.4, 0.4],
            },
        },
        props: {
            movable_props: {
                wheels: {
                    mass: 10,
                    friction: 100,
                },
            },
        },
    },
};
