import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

export function compareTemperatureChart() {
  d3.json('estrus_combined.json').then(data => {
    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };

    const svg = d3.select('#other-viz')
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const x = d3.scaleLinear()
      .domain(d3.extent(data, d => d.time))
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain(d3.extent(data, d => d.temperature))
      .nice()
      .range([height - margin.bottom, margin.top]);

    const line = d3.line()
      .x(d => x(d.time))
      .y(d => y(d.temperature));

    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .append('text')
      .attr('x', width / 2)
      .attr('y', 35)
      .attr('fill', 'black')
      .attr('text-anchor', 'middle')
      .text('Time');

    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y))
      .append('text')
      .attr('x', -height / 2)
      .attr('y', -40)
      .attr('transform', 'rotate(-90)')
      .attr('fill', 'black')
      .attr('text-anchor', 'middle')
      .text('Temperature (°C)');

    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'tomato')
      .attr('stroke-width', 2)
      .attr('d', line);
  });
}
