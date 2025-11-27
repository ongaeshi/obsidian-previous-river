# note_generator.rb
# Usage: ruby note_generator.rb <number_of_notes>

require 'fileutils'

def generate_notes(directory, name, count)
    FileUtils.mkdir_p(directory) unless Dir.exist?(directory)

    count.times do |i|
        previous_value = if i == 0
          "ROOT"
        else 
          "[[#{name}_#{format('%02d', (i - 1) % count)}]]"
        end
        current_note = "#{name}_#{format('%02d', i)}.md"

        content = <<~MARKDOWN.chomp + "\n"
            ---
            previous: "#{previous_value}"
            ---
        MARKDOWN

        File.open(File.join(directory, current_note), 'wb') { |file| file.write(content) }
    end
end

if ARGV.size != 1
    puts "Usage: ruby #{$PROGRAM_NAME} <number_of_notes>"
    exit 1
end

note_count = ARGV[0].to_i
if note_count <= 0
    puts "Please provide a positive number of notes."
    exit 1
end

generate_notes('.', "note", note_count)
puts "Generated #{note_count} notes."
