const vertex = `#version 300 es

layout (location = 0) in vec4 aPosition;
layout (location = 1) in vec2 aTexCoord;
layout (location = 2) in vec3 aNormal;

uniform mat4 uMvpMatrix;
uniform mat4 uWorldMatrix;

out vec2 vTexCoord;
out vec3 vNormal;
out vec3 vFragPos;

void main() {
    vNormal = normalize((uWorldMatrix * vec4(aNormal, 0.0)).xyz);
    vFragPos = vec3(uWorldMatrix * aPosition);
    vTexCoord = aTexCoord;
    gl_Position = uMvpMatrix * aPosition;
}
`;

const fragment = `#version 300 es
precision mediump float;
precision mediump int;


struct AmbientLight {
    vec3 intensity;
};

struct DirectionalLight {
    vec3 direction;
    vec3 diffuse;
    vec3 specular;
};

struct SpotLight {
    vec3 position;
    vec3 direction;
    float cutOff;
    float outerCutOff;
    float innerCutOff;
    vec3 diffuse;
    vec3 specular;
    vec3 attenuation;
};

struct PointLight {
    vec3 position;  
    vec3 diffuse;
    vec3 specular;	
    vec3 attenuation;
}; 

uniform mediump sampler2D uTexture;
uniform DirectionalLight uDirectionalLight;
uniform AmbientLight uAmbientLight;

uniform SpotLight uSpotLight[32];
uniform int uNumberOfSpotlights;

uniform PointLight uPointLight[32];
uniform int uNumberOfPointLights;

uniform vec3 viewPosition;


in vec2 vTexCoord;
in vec3 vNormal;
in vec3 vFragPos; 

out vec4 oColor;

vec3 computeSpotLights(SpotLight[32] spotLights, int numberOfSpotlights, vec3 vFragPos, vec3 vNormal, vec3 viewPosition) {
    vec3 spot;
    for (int i = 0; i < numberOfSpotlights; i++) {
        // Diffuse
        vec3 lightDir = normalize(spotLights[i].position - vFragPos);  
        float diff = max(dot(vNormal, normalize(lightDir)), 0.0);
        vec3 diffuse = diff * spotLights[i].diffuse;
    
        // Specular
        vec3 viewDir = normalize(viewPosition - vFragPos);
        vec3 reflectDir = reflect(-lightDir, vNormal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
        vec3 specular = 0.7 * spec * spotLights[i].specular;

        // Spot intensity
        vec3 spotLightDir = normalize(spotLights[i].position - vFragPos);
        float theta = dot(spotLightDir, normalize(-spotLights[i].direction));
        float d = distance(vFragPos, spotLights[i].position);
        vec3 attenuation = spotLights[i].attenuation * vec3(1, d, d * d);
        float attenuationValue = 1.0 / dot(attenuation, vec3(1, 1, 1));

        float intensity = smoothstep(spotLights[i].outerCutOff, spotLights[i].innerCutOff, theta) * attenuationValue;
        if (intensity > 0.0) {
            spot += (diffuse + specular) * intensity;
        }
    }
    return spot;
}

vec3 computeDirectionalLight(DirectionalLight directionalLight, vec3 vFragPos, vec3 vNormal, vec3 viewPosition) {
    // Diffuse
    vec3 lightDir = normalize(-directionalLight.direction);  
    float diff = max(dot(vNormal, normalize(lightDir)), 0.0);
    vec3 diffuse = diff * directionalLight.diffuse;

    // Specular
    vec3 viewDir = normalize(viewPosition - vFragPos);
    vec3 reflectDir = reflect(-lightDir, vNormal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    vec3 specular = 0.7 * spec * directionalLight.specular;
    
    vec3 directional = specular + diffuse;
    return directional;
}

vec3 computePointLights(PointLight[32] pointLights, int numberOfPointLights, vec3 vFragPos, vec3 vNormal, vec3 viewPosition) {
    vec3 point;
    for (int i = 0; i < numberOfPointLights; i++) {
        // Diffuse
        vec3 lightDir = normalize(pointLights[i].position - vFragPos);  
        float diff = max(dot(vNormal, normalize(lightDir)), 0.0);
        vec3 diffuse = diff * pointLights[i].diffuse;
    
        // Specular
        vec3 viewDir = normalize(viewPosition - vFragPos);
        vec3 reflectDir = reflect(-lightDir, vNormal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
        vec3 specular = 0.7 * spec * pointLights[i].specular;

        // Spot intensity
        float d = distance(vFragPos, pointLights[i].position);
        vec3 attenuation = pointLights[i].attenuation * vec3(1, d, d * d);
        float attenuationValue = 1.0 / dot(attenuation, vec3(1, 1, 1));

        point += (diffuse + specular) * attenuationValue;
    }
    return point;
}

void main() {
    vec4 texel = texture(uTexture, vTexCoord);

    // Directional lights
    vec3 directional = computeDirectionalLight(uDirectionalLight, vFragPos, vNormal, viewPosition);
    
    // Spot lights
    vec3 spot = computeSpotLights(uSpotLight, uNumberOfSpotlights, vFragPos, vNormal, viewPosition);

    // Point lights
    vec3 point = computePointLights(uPointLight, uNumberOfPointLights, vFragPos, vNormal, viewPosition);

    vec3 light = uAmbientLight.intensity + directional + spot + point; 
    oColor = vec4(texel.rgb * light, texel.a);
}

`;

const skyBoxVertex = `#version 300 es

layout (location = 0) in vec4 aPosition;
layout (location = 1) in vec2 aTexCoord;
layout (location = 2) in vec3 aNormal;

uniform mat4 uMvpMatrix;

out vec2 vTexCoord;

void main() {
    vTexCoord = aTexCoord;
    gl_Position = uMvpMatrix * aPosition;
}
`;

const skyBoxFragment = `#version 300 es
precision mediump float;

in vec2 vTexCoord;
in vec3 vNormal;
in vec3 vFragPos;

uniform mediump sampler2D uTexture;

out vec4 oColor;

void main() {
    oColor = texture(uTexture, vTexCoord);
}
`;

export default {
	simple: [vertex, fragment],
	skyBox: [skyBoxVertex, skyBoxFragment],
};
