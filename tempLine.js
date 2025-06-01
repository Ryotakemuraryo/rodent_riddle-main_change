import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

export function compareTemperatureChart() {
  Promise.all([
    d3.json('./data/estrus_combined.json'),
    d3.json('./data/1daybefore_estrus_combined.json'),
    d3.json('./data/1dayafter_estrus_combined.json'),
    d3.json('./data/2dayafter_estrus_combined.json')
  ]).then(([estrusData, beforeData, after1Data, after2Data]) => {
    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 50, left: 50 };

    const svg = d3.select('#other-viz')
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const allData = estrusData.concat(beforeData, after1Data, after2Data);

    const x = d3.scaleLinear()
      .domain(d3.extent(allData, d => d.time))
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain(d3.extent(allData, d => d.temperature))
      .nice()
      .range([height - margin.bottom, margin.top]);

    const line = d3.line()
      .x(d => x(d.time))
      .y(d => y(d.temperature));

    // 背景グラデーション
    svg.append("defs")
    .append("linearGradient")
    .attr("id", "background-gradient")
    .attr("x1", "0%").attr("x2", "100%")
    .attr("y1", "0%").attr("y2", "0%")
    .selectAll("stop")
    .data([
        { offset: "0%", color: "#506680" },   // left edge: night
        { offset: "50%", color: "#F4C05E" },  // center: day
        { offset: "100%", color: "#506680" }  // right edge: night
    ])
    .enter()
    .append("stop")
    .attr("offset", d => d.offset)
    .attr("stop-color", d => d.color);


    svg.append("clipPath")
      .attr("id", "clip-region")
      .append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom);

    svg.append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom)
      .attr("fill", "url(#background-gradient)")
      .attr("clip-path", "url(#clip-region)")
      .attr("opacity", 0.5);
    // 軸
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .append('text')
      .attr('x', width / 2)
      .attr('y', 40)
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

    // 線描画
    const datasets = [
      { data: estrusData, color: 'tomato', label: 'Estrus Day' },
      { data: beforeData, color: 'steelblue', label: '1 Day Before' },
      { data: after1Data, color: 'green', label: '1 Day After' },
      { data: after2Data, color: 'purple', label: '2 Days After' }
    ];

    datasets.forEach(d => {
      svg.append('path')
        .datum(d.data)
        .attr('fill', 'none')
        .attr('stroke', d.color)
        .attr('stroke-width', 2)
        .attr('d', line);
    });

    // 凡例
    datasets.forEach((d, i) => {
      const yPos = 30 + i * 20;
      svg.append("circle").attr("cx", width - 150).attr("cy", yPos).attr("r", 6).style("fill", d.color);
      svg.append("text").attr("x", width - 140).attr("y", yPos + 4).text(d.label).style("font-size", "12px");
    });

    // ツールチップと縦線
    const tooltip = d3.select("#other-viz")
      .append("div")
      .style("position", "absolute")
      .style("background", "white")
      .style("border", "1px solid #999")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("display", "none")
      .style("pointer-events", "none");

    const hoverLine = svg.append("line")
      .attr("stroke", "gray")
      .attr("stroke-width", 1)
      .attr("y1", margin.top)
      .attr("y2", height - margin.bottom)
      .style("opacity", 0);

    const bisectTime = d3.bisector(d => d.time).left;

    svg.append("rect")
      .attr("fill", "transparent")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom)
      .on("mousemove", (event) => {
        const [mouseX] = d3.pointer(event);
        const time = x.invert(mouseX);

        function getActivity(data) {
          const i = bisectTime(data, time);
          const d0 = data[i - 1], d1 = data[i];
          if (!d0 || !d1) return null;
          return Math.abs(time - d0.time) < Math.abs(time - d1.time) ? d0.act : d1.act;
        }

        const activities = {};
        datasets.forEach(d => {
          activities[d.label] = getActivity(d.data);
        });

        // sort by activity value descending
        const sorted = Object.entries(activities)
          .filter(([, val]) => val != null)
          .sort((a, b) => b[1] - a[1]);

        hoverLine
          .attr("x1", x(time))
          .attr("x2", x(time))
          .style("opacity", 1);

        tooltip
          .html(`
            <strong>Time:</strong> ${Math.round(time)}<br/>
            ${sorted.map(([label, value]) => {
              const color = datasets.find(d => d.label === label)?.color || 'black';
              return `<span style="color: ${color}">●</span> ${label}: ${value.toFixed(1)}`;
            }).join("<br/>")}
          `)
          .style("left", `${event.pageX + 15}px`)
          .style("top", `${event.pageY - 20}px`)
          .style("display", "block");
      })
      .on("mouseout", () => {
        hoverLine.style("opacity", 0);
        tooltip.style("display", "none");
      });
  });
}

