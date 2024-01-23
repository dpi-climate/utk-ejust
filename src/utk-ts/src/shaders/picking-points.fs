#version 300 es

in highp vec4 idColors;
out highp vec4 fragColor;

void main() {
    // fragColor = vec4(idColors[0],idColors[1],1,1);
    fragColor =  idColors;
}